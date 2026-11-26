/**
 * The PERF-1 demo list. The same data and the same memoized row are rendered
 * two ways so the cost of spreading inside renderItem can be compared directly.
 */
import { useRenderTracker } from "@/lab/RenderTrackerContext";
import { useCallback, useState } from "react";
import { FlatList, type ListRenderItem } from "react-native";
import type { Transaction } from "./buildTransactions";
import { SpreadTransactionRow, TransactionRow } from "./TransactionRow";

type RenderItemMode = "spread" | "direct";

type TransactionListProps = {
  transactions: Transaction[];
  mode: RenderItemMode;

  /** How long each row blocks the JS thread while rendering, to simulate a heavy row. */
  rowCostMs?: number;
};

function TransactionList({
  transactions,
  mode,
  rowCostMs = 1,
}: TransactionListProps) {
  const tracker = useRenderTracker();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectTransaction = useCallback(
    (id: string) => {
      tracker.startInteraction();
      setSelectedId(id);
    },
    [tracker],
  );

  // ❌ PERF-1 violation: a brand new object is built for every row on every
  // render, so React.memo on the row always sees a "changed" item prop.
  const renderSpreadItem: ListRenderItem<Transaction> = useCallback(
    ({ item }) => (
      <SpreadTransactionRow
        item={{ ...item, isSelected: item.id === selectedId }}
        rowCostMs={rowCostMs}
        selectTransaction={selectTransaction}
      />
    ),
    [selectedId, rowCostMs, selectTransaction],
  );

  // ✅ PERF-1 compliant: the original item reference is passed through and the
  // extra state is a separate primitive prop, so unchanged rows bail out.
  const renderDirectItem: ListRenderItem<Transaction> = useCallback(
    ({ item }) => (
      <TransactionRow
        item={item}
        isSelected={item.id === selectedId}
        rowCostMs={rowCostMs}
        selectTransaction={selectTransaction}
      />
    ),
    [selectedId, rowCostMs, selectTransaction],
  );

  return (
    <FlatList
      testID="transaction-list"
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={mode === "spread" ? renderSpreadItem : renderDirectItem}
    />
  );
}

export default TransactionList;
export type { RenderItemMode };
