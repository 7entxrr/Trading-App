//+------------------------------------------------------------------+
//|                                          GoldMinerMonitor.mq5     |
//|                                                                    |
//| READ-ONLY monitoring bridge for the GoldMiner dashboard.          |
//|                                                                    |
//| This Expert Advisor reads account, position and basket state and  |
//| writes it to a JSON snapshot file on a timer. It NEVER places,    |
//| modifies, or closes a trade, and never will:                      |
//|                                                                    |
//|   - No #include <Trade\Trade.mqh> (that is where CTrade lives)    |
//|   - No OrderSend / OrderCheck / OrderCalcMargin                   |
//|   - No PositionClose / PositionModify                             |
//|   - No OrderModify / OrderDelete                                  |
//|                                                                    |
//| Every MT5 API call below is read-only: AccountInfo*, Position*,   |
//| SymbolInfo*, TerminalInfoInteger, History* (deal history is read  |
//| via HistorySelect/HistoryDealGet* only — never modified). If you  |
//| are extending this file and find yourself reaching for a trading  |
//| function, stop — that capability belongs nowhere in this          |
//| pipeline. See ../docs/READ_ONLY.md for the full guarantee.        |
//+------------------------------------------------------------------+
#property copyright "GoldMiner Dashboard"
#property strict
#property version   "1.10"

input int    InpIntervalSeconds   = 5;       // Snapshot interval
input long   InpGoldMinerMagic    = 222111;  // GoldMiner primary magic number
input long   InpHedgeMagic        = 111112;  // GoldMiner hedge magic number
input int    InpDayResetHourIST   = 4;       // IST hour the trading day resets at (00-23)

const long   IST_OFFSET_SECONDS = 19800; // UTC+5:30, no DST

//+------------------------------------------------------------------+
//| Minimal JSON string helpers (no library dependency)               |
//+------------------------------------------------------------------+
string JsonEscape(const string text)
{
   string out = text;
   StringReplace(out, "\\", "\\\\");
   StringReplace(out, "\"", "\\\"");
   return out;
}

string JsonStr(const string key, const string value, const bool trailingComma = true)
{
   return "\"" + key + "\":\"" + JsonEscape(value) + "\"" + (trailingComma ? "," : "");
}

string JsonNum(const string key, const double value, const bool trailingComma = true)
{
   return "\"" + key + "\":" + DoubleToString(value, 2) + (trailingComma ? "," : "");
}

string JsonInt(const string key, const long value, const bool trailingComma = true)
{
   return "\"" + key + "\":" + IntegerToString(value) + (trailingComma ? "," : "");
}

string JsonBool(const string key, const bool value, const bool trailingComma = true)
{
   return "\"" + key + "\":" + (value ? "true" : "false") + (trailingComma ? "," : "");
}

//+------------------------------------------------------------------+
//| IST day-boundary helpers (read-only clock math, no side effects)  |
//+------------------------------------------------------------------+
datetime TodayIstResetBoundaryInGmt()
{
   const datetime nowGmt = TimeGMT();
   const datetime nowIst = (datetime)((long)nowGmt + IST_OFFSET_SECONDS);

   MqlDateTime ist;
   TimeToStruct(nowIst, ist);

   const int resetSecondOfDay = InpDayResetHourIST * 3600;
   const int nowSecondOfDay   = ist.hour * 3600 + ist.min * 60 + ist.sec;

   MqlDateTime boundaryIst = ist;
   boundaryIst.hour = InpDayResetHourIST;
   boundaryIst.min  = 0;
   boundaryIst.sec  = 0;
   datetime boundaryIstAsGmtStruct = StructToTime(boundaryIst); // treated as if it were GMT

   // If we are before today's reset hour, the active trading day started
   // yesterday's reset hour instead.
   if(nowSecondOfDay < resetSecondOfDay)
      boundaryIstAsGmtStruct -= 24 * 3600;

   // boundaryIstAsGmtStruct currently holds the IST wall-clock instant as if
   // it were GMT; shift it back by the IST offset to get the real GMT instant.
   return (datetime)((long)boundaryIstAsGmtStruct - IST_OFFSET_SECONDS);
}

//+------------------------------------------------------------------+
//| Read-only history helpers                                         |
//+------------------------------------------------------------------+
/** Sum of profit+swap+commission across every deal since the current
 *  trading day's reset boundary — i.e. today's realised P/L. Read-only:
 *  HistorySelect/HistoryDealGet* never mutate anything. */
double TodayRealizedPnL()
{
   const datetime from = TodayIstResetBoundaryInGmt();
   const datetime to   = TimeCurrent() + 60;
   if(!HistorySelect(from, to)) return 0.0;

   double total = 0.0;
   const int deals = HistoryDealsTotal();
   for(int i = 0; i < deals; i++)
   {
      const ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0) continue;
      total += HistoryDealGetDouble(dealTicket, DEAL_PROFIT)
             + HistoryDealGetDouble(dealTicket, DEAL_SWAP)
             + HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
   }
   return total;
}

/** Commission already charged against one open position, found by summing
 *  the commission of every deal recorded against that position id so far
 *  (normally just the opening deal). Read-only. */
double PositionCommission(const ulong positionId)
{
   if(!HistorySelectByPosition((long)positionId)) return 0.0;
   double total = 0.0;
   const int deals = HistoryDealsTotal();
   for(int i = 0; i < deals; i++)
   {
      const ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0) continue;
      total += HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
   }
   return total;
}

//+------------------------------------------------------------------+
//| One aggregated BUY or SELL basket for a single magic number       |
//+------------------------------------------------------------------+
struct BasketAgg
{
   long   magic;
   int    direction; // 0 = BUY, 1 = SELL
   string symbol;
   int    count;
   double totalVolume;
   double weightedEntrySum; // sum(volume * openPrice), divide by totalVolume for average
   double pnl;
   double sharedTp;         // valid only when sharedTpConsistent is true
   bool   sharedTpConsistent;
   bool   sharedTpSeen;
   datetime firstOpen;
};

//+------------------------------------------------------------------+
//| Snapshot one terminal's account + positions + baskets to JSON     |
//+------------------------------------------------------------------+
void WriteSnapshot()
{
   const long   login    = AccountInfoInteger(ACCOUNT_LOGIN);
   const string broker   = AccountInfoString(ACCOUNT_COMPANY);
   const string server   = AccountInfoString(ACCOUNT_SERVER);
   const string currency = AccountInfoString(ACCOUNT_CURRENCY);
   const double balance  = AccountInfoDouble(ACCOUNT_BALANCE);
   const double equity   = AccountInfoDouble(ACCOUNT_EQUITY);
   const double margin   = AccountInfoDouble(ACCOUNT_MARGIN);
   const double freeMgn  = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   const double mgnLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   const bool   connected = (bool)TerminalInfoInteger(TERMINAL_CONNECTED);
   // Whether this terminal is allowed to run any EA's trading logic at all.
   // Used by the backend as one honest signal for "is an EA able to be
   // active here" — see mt5-bridge/README.md's "EA status" section for the
   // full limitation: this cannot see inside GoldMiner's own process.
   const bool   algoAllowed = (bool)TerminalInfoInteger(TERMINAL_TRADE_ALLOWED);
   const double todayRealized = TodayRealizedPnL();

   // --- Positions: read-only enumeration, and basket aggregation by
   //     (magic, direction, symbol) so GoldMiner's BUY/SELL grids show up
   //     as the baskets the dashboard expects. ---
   const int total = PositionsTotal();
   BasketAgg baskets[];
   ArrayResize(baskets, 0);

   string positionsJson = "[";
   int openCount = 0;

   for(int i = 0; i < total; i++)
   {
      const ulong ticket = PositionGetTicket(i);
      if(ticket == 0 || !PositionSelectByTicket(ticket)) continue;

      const long   magic     = PositionGetInteger(POSITION_MAGIC);
      const int    type      = (int)PositionGetInteger(POSITION_TYPE); // 0 BUY, 1 SELL
      const string symbol    = PositionGetString(POSITION_SYMBOL);
      const double volume    = PositionGetDouble(POSITION_VOLUME);
      const double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      const double curPrice  = PositionGetDouble(POSITION_PRICE_CURRENT);
      const double tp        = PositionGetDouble(POSITION_TP);
      const double sl        = PositionGetDouble(POSITION_SL);
      const double profit    = PositionGetDouble(POSITION_PROFIT);
      const double swap      = PositionGetDouble(POSITION_SWAP);
      const datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
      const string comment   = PositionGetString(POSITION_COMMENT);
      const ulong  positionId = (ulong)PositionGetInteger(POSITION_IDENTIFIER);
      const double commission = PositionCommission(positionId);
      const double symbolPoint = SymbolInfoDouble(symbol, SYMBOL_POINT);

      if(openCount > 0) positionsJson += ",";
      positionsJson += "{";
      positionsJson += JsonInt("ticket", (long)ticket);
      positionsJson += JsonStr("symbol", symbol);
      positionsJson += JsonStr("direction", type == 0 ? "BUY" : "SELL");
      positionsJson += JsonNum("lot", volume);
      positionsJson += JsonNum("entryPrice", openPrice);
      positionsJson += JsonNum("currentPrice", curPrice);
      positionsJson += JsonNum("tp", tp);
      positionsJson += JsonNum("sl", sl);
      positionsJson += JsonNum("pnl", profit);
      positionsJson += JsonNum("swap", swap);
      positionsJson += JsonNum("commission", commission);
      positionsJson += JsonInt("openTime", (long)openTime);
      positionsJson += JsonInt("magic", magic);
      positionsJson += JsonNum("symbolPoint", symbolPoint);
      positionsJson += JsonStr("comment", comment, false);
      positionsJson += "}";
      openCount++;

      // Only aggregate GoldMiner's own magic numbers into baskets; other
      // positions on the account (if any) are still reported individually
      // above, just not folded into a GoldMiner basket.
      if(magic != InpGoldMinerMagic && magic != InpHedgeMagic) continue;

      int slot = -1;
      for(int b = 0; b < ArraySize(baskets); b++)
      {
         if(baskets[b].magic == magic && baskets[b].direction == type && baskets[b].symbol == symbol)
         {
            slot = b;
            break;
         }
      }
      if(slot == -1)
      {
         slot = ArraySize(baskets);
         ArrayResize(baskets, slot + 1);
         baskets[slot].magic = magic;
         baskets[slot].direction = type;
         baskets[slot].symbol = symbol;
         baskets[slot].count = 0;
         baskets[slot].totalVolume = 0;
         baskets[slot].weightedEntrySum = 0;
         baskets[slot].pnl = 0;
         baskets[slot].sharedTp = tp;
         baskets[slot].sharedTpConsistent = true;
         baskets[slot].sharedTpSeen = false;
         baskets[slot].firstOpen = openTime;
      }

      baskets[slot].count++;
      baskets[slot].totalVolume += volume;
      baskets[slot].weightedEntrySum += volume * openPrice;
      baskets[slot].pnl += profit + swap + commission;
      if(openTime < baskets[slot].firstOpen) baskets[slot].firstOpen = openTime;

      if(!baskets[slot].sharedTpSeen)
      {
         baskets[slot].sharedTp = tp;
         baskets[slot].sharedTpSeen = true;
      }
      else if(MathAbs(baskets[slot].sharedTp - tp) > 0.0000001)
      {
         baskets[slot].sharedTpConsistent = false;
      }
   }
   positionsJson += "]";

   // --- Baskets JSON ---
   string basketsJson = "[";
   for(int b = 0; b < ArraySize(baskets); b++)
   {
      if(b > 0) basketsJson += ",";
      const double avgEntry = baskets[b].totalVolume > 0
         ? baskets[b].weightedEntrySum / baskets[b].totalVolume
         : 0.0;
      const double symbolPoint = SymbolInfoDouble(baskets[b].symbol, SYMBOL_POINT);
      basketsJson += "{";
      basketsJson += JsonStr("symbol", baskets[b].symbol);
      basketsJson += JsonStr("direction", baskets[b].direction == 0 ? "BUY" : "SELL");
      basketsJson += JsonInt("magic", baskets[b].magic);
      basketsJson += JsonInt("positionCount", baskets[b].count);
      basketsJson += JsonNum("totalLots", baskets[b].totalVolume);
      basketsJson += JsonNum("averageEntry", avgEntry);
      if(baskets[b].sharedTpConsistent && baskets[b].sharedTpSeen)
         basketsJson += JsonNum("basketTP", baskets[b].sharedTp);
      else
         basketsJson += "\"basketTP\":null,";
      basketsJson += JsonNum("pnl", baskets[b].pnl);
      basketsJson += JsonNum("symbolPoint", symbolPoint);
      basketsJson += JsonInt("openedAt", (long)baskets[b].firstOpen, false);
      basketsJson += "}";
   }
   basketsJson += "]";

   // --- Assemble the full snapshot ---
   string json = "{";
   json += JsonInt("login", login);
   json += JsonStr("broker", broker);
   json += JsonStr("server", server);
   json += JsonStr("currency", currency);
   json += JsonNum("balance", balance);
   json += JsonNum("equity", equity);
   json += JsonNum("margin", margin);
   json += JsonNum("freeMargin", freeMgn);
   json += JsonNum("marginLevel", mgnLevel);
   json += JsonBool("terminalConnected", connected);
   json += JsonBool("algoTradingEnabled", algoAllowed);
   json += JsonNum("todayRealizedPnL", todayRealized);
   json += JsonInt("openPositions", openCount);
   json += JsonInt("snapshotTime", (long)TimeGMT());
   json += "\"positions\":" + positionsJson + ",";
   json += "\"baskets\":" + basketsJson;
   json += "}";

   const string filename = StringFormat("goldminer_snapshot_%d.json", login);
   const int handle = FileOpen(filename, FILE_WRITE | FILE_TXT | FILE_COMMON | FILE_ANSI);
   if(handle == INVALID_HANDLE)
   {
      Print("GoldMinerMonitor: failed to open ", filename, " for writing, error ", GetLastError());
      return;
   }
   FileWriteString(handle, json);
   FileClose(handle);
}

//+------------------------------------------------------------------+
//| Expert initialisation                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   EventSetTimer(MathMax(1, InpIntervalSeconds));
   WriteSnapshot();
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| On every timer tick: read state and write the snapshot. Nothing   |
//| else happens here — no order or position function is called.      |
//+------------------------------------------------------------------+
void OnTimer()
{
   WriteSnapshot();
}
