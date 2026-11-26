/**
 * Two memoized versions of the same list row for the PERF-1 demo.
 *
 * `SpreadTransactionRow` receives one merged `item` object (the pattern PERF-1
 * forbids), while `TransactionRow` receives the item and the selection state as
 * separate props. Both are wrapped in React.memo, so the only difference is
 * whether the shallow prop comparison can succeed.
 */
import { useTrackRender } from "@/lab/RenderTrackerContext";
import labTheme from "@/lab/labTheme";
import simulateWork from "@/lab/simulateWork";
import useRenderFlash from "@/lab/useRenderFlash";
import { memo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { Transaction } from "./buildTransactions";

type RowContentProps = {
  transaction: Transaction;
  isSelected: boolean;
  renderCount: number;
  rowCostMs: number;
  selectTransaction: (id: string) => void;
};

function RowContent({
  transaction,
  isSelected,
  renderCount,
  rowCostMs,
  selectTransaction,
}: RowContentProps) {
  // Stands in for real per-row work (formatting, nested views) so wasted renders cost time.
  simulateWork(rowCostMs);
  const flashOpacity = useRenderFlash();
  const hasReRendered = renderCount > 1;

  console.log(
    `RowContent render: ${transaction.id} (selected: ${isSelected}, renderCount: ${renderCount})`,
  );

  return (
    <Pressable
      testID={`row-${transaction.id}`}
      accessibilityRole="button"
      onPress={() => selectTransaction(transaction.id)}
      style={[styles.row, isSelected && styles.rowSelected]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.flash, { opacity: flashOpacity }]}
      />
      <View style={styles.texts}>
        <Text style={styles.merchant}>{transaction.merchant}</Text>
        <Text style={styles.amount}>${transaction.amount.toFixed(2)}</Text>
      </View>
      <View
        style={[
          styles.badge,
          hasReRendered ? styles.badgeHot : styles.badgeCold,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            hasReRendered ? styles.badgeTextHot : styles.badgeTextCold,
          ]}
        >
          renders: {renderCount}
        </Text>
      </View>
    </Pressable>
  );
}

type SpreadTransactionRowProps = {
  item: Transaction & { isSelected: boolean };
  rowCostMs: number;
  selectTransaction: (id: string) => void;
};

const SpreadTransactionRow = memo(function SpreadTransactionRow({
  item,
  rowCostMs,
  selectTransaction,
}: SpreadTransactionRowProps) {
  const renderCount = useTrackRender(item.id);
  return (
    <RowContent
      transaction={item}
      isSelected={item.isSelected}
      renderCount={renderCount}
      rowCostMs={rowCostMs}
      selectTransaction={selectTransaction}
    />
  );
});

type TransactionRowProps = {
  item: Transaction;
  isSelected: boolean;
  rowCostMs: number;
  selectTransaction: (id: string) => void;
};

const TransactionRow = memo(function TransactionRow({
  item,
  isSelected,
  rowCostMs,
  selectTransaction,
}: TransactionRowProps) {
  const renderCount = useTrackRender(item.id);
  return (
    <RowContent
      transaction={item}
      isSelected={isSelected}
      renderCount={renderCount}
      rowCostMs={rowCostMs}
      selectTransaction={selectTransaction}
    />
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: labTheme.spacing.lg,
    paddingVertical: labTheme.spacing.md,
    backgroundColor: labTheme.color.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: labTheme.color.border,
  },
  rowSelected: {
    backgroundColor: labTheme.color.selected,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: labTheme.color.flash,
  },
  texts: {
    flex: 1,
  },
  merchant: {
    fontSize: 15,
    fontWeight: "600",
    color: labTheme.color.text,
  },
  amount: {
    fontSize: 13,
    color: labTheme.color.muted,
  },
  badge: {
    paddingHorizontal: labTheme.spacing.sm,
    paddingVertical: labTheme.spacing.xs,
    borderRadius: labTheme.radius,
  },
  badgeHot: {
    backgroundColor: labTheme.color.badSoft,
  },
  badgeCold: {
    backgroundColor: labTheme.color.goodSoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextHot: {
    color: labTheme.color.bad,
  },
  badgeTextCold: {
    color: labTheme.color.good,
  },
});

export { SpreadTransactionRow, TransactionRow };
