/**
 * PERF-5 demo: a list of loan rows wrapped in React.memo with a custom
 * comparison. Each loan carries a long payment history the row never shows.
 * One version deep-compares the whole loan, the other compares only the fields
 * the row displays. Press the buttons and compare the time spent comparing.
 */
import { memo, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Payment = { id: number; amount: number; date: string };
type Loan = {
  id: string;
  name: string;
  status: "active" | "paid";
  balance: number;
  payments: Payment[];
};

const LOAN_COUNT = 100;
const PAYMENTS_PER_LOAN = 2_000;

function buildLoans(): Loan[] {
  return Array.from({ length: LOAN_COUNT }, (_, index) => ({
    id: `loan-${index}`,
    name: `Loan #${index}`,
    status: "active",
    balance: 1_000 + index * 10,
    payments: Array.from({ length: PAYMENTS_PER_LOAN }, (__, p) => ({
      id: p,
      amount: 50,
      date: "2026-01-01",
    })),
  }));
}

/** Simulates a refetch: brand new objects with exactly the same contents. */
function cloneLoans(loans: Loan[]): Loan[] {
  return loans.map((loan) => ({
    ...loan,
    payments: loan.payments.map((payment) => ({ ...payment })),
  }));
}

/** What the last update cost. Module-level so the comparators can write to it. */
export const compareStats = { fieldsCompared: 0, ms: 0, rowRenders: 0 };

export function resetCompareStats() {
  compareStats.fieldsCompared = 0;
  compareStats.ms = 0;
  compareStats.rowRenders = 0;
}

/** A plain recursive deep-equal, like lodash's isEqual. Counts every field it checks. */
function deepEqual(a: unknown, b: unknown): boolean {
  compareStats.fieldsCompared += 1;
  if (a === b) {
    return true;
  }
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
    return false;
  }
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) {
    return false;
  }
  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

type RowProps = { loan: Loan };

function LoanRow({ loan }: RowProps) {
  compareStats.rowRenders += 1;
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{loan.name}</Text>
      <Text style={loan.status === "paid" ? styles.paid : styles.active}>
        {loan.status}
      </Text>
      <Text style={styles.balance}>${loan.balance}</Text>
    </View>
  );
}

/** Times a comparator and adds the result to `compareStats`. */
function timed(compare: (prev: RowProps, next: RowProps) => boolean) {
  return (prev: RowProps, next: RowProps) => {
    const start = performance.now();
    const isEqual = compare(prev, next);
    compareStats.ms += performance.now() - start;
    return isEqual;
  };
}

// ❌ PERF-5 violation: walks all 2,000 payments of every loan on every update,
// even though the row only shows name, status and balance.
const DeepLoanRow = memo(
  LoanRow,
  timed((prev, next) => deepEqual(prev.loan, next.loan)),
);

// ✅ PERF-5: compare only the fields the row actually renders.
const ShallowLoanRow = memo(
  LoanRow,
  timed((prev, next) => {
    compareStats.fieldsCompared += 3;
    return (
      prev.loan.name === next.loan.name &&
      prev.loan.status === next.loan.status &&
      prev.loan.balance === next.loan.balance
    );
  }),
);

type Mode = "deep" | "shallow";

const LoanList = memo(function LoanList({
  loans,
  mode,
}: {
  loans: Loan[];
  mode: Mode;
}) {
  const Row = mode === "deep" ? DeepLoanRow : ShallowLoanRow;
  return (
    <ScrollView>
      {loans.map((loan) => (
        <Row key={loan.id} loan={loan} />
      ))}
    </ScrollView>
  );
});

function Perf5Screen() {
  const [mode, setMode] = useState<Mode>("deep");
  const [loans, setLoans] = useState(buildLoans);
  const [lastUpdate, setLastUpdate] = useState({ ...compareStats });

  // Runs after React has finished comparing and rendering the rows.
  useEffect(() => {
    setLastUpdate({ ...compareStats });
  }, [loans, mode]);

  const update = (nextLoans: Loan[]) => {
    resetCompareStats();
    setLoans(nextLoans);
  };

  const refetchSameData = () => update(cloneLoans(loans));

  const markFirstLoanPaid = () =>
    update(
      cloneLoans(loans).map((loan, index) =>
        index === 0
          ? { ...loan, status: loan.status === "paid" ? "active" : "paid" }
          : loan,
      ),
    );

  const switchMode = (nextMode: Mode) => {
    resetCompareStats();
    setMode(nextMode);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.toggle}>
        <Pressable
          testID="mode-deep"
          onPress={() => switchMode("deep")}
          style={[styles.button, mode === "deep" && styles.buttonActive]}
        >
          <Text>❌ deepEqual(loan)</Text>
        </Pressable>
        <Pressable
          testID="mode-shallow"
          onPress={() => switchMode("shallow")}
          style={[styles.button, mode === "shallow" && styles.buttonActive]}
        >
          <Text>✅ Compare 3 fields</Text>
        </Pressable>
      </View>

      <View style={styles.toggle}>
        <Pressable
          testID="refetch"
          onPress={refetchSameData}
          style={styles.action}
        >
          <Text style={styles.actionText}>Refetch (same data)</Text>
        </Pressable>
        <Pressable
          testID="mark-paid"
          onPress={markFirstLoanPaid}
          style={styles.action}
        >
          <Text style={styles.actionText}>Toggle Loan #0 paid</Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsBig}>
          {lastUpdate.ms.toFixed(1)} ms comparing props
        </Text>
        <Text style={styles.statsSmall}>
          {lastUpdate.fieldsCompared.toLocaleString()} fields compared ·{" "}
          {lastUpdate.rowRenders} rows re-rendered
        </Text>
      </View>

      <LoanList loans={loans} mode={mode} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  toggle: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  button: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonActive: { borderColor: "#2F6FED", backgroundColor: "#E8F0FE" },
  action: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  actionText: { color: "#fff", fontWeight: "700" },
  stats: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1B1D21",
  },
  statsBig: { color: "#fff", fontSize: 20, fontWeight: "700" },
  statsSmall: { color: "#A1A7B3" },
  row: {
    flexDirection: "row",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  name: { flex: 1, fontWeight: "600" },
  active: { width: 70, color: "#2F6FED" },
  paid: { width: 70, color: "#1E9E5A", fontWeight: "700" },
  balance: { width: 80, textAlign: "right" },
});

export default Perf5Screen;
