---
ruleId: PERF-21
title: List rows read their own store data
---

## [PERF-21] List rows read their own store data

### Reasoning

If a list reads collections and passes members to its rows as props, or puts collections in FlatList `extraData`, then every write to those collections re-renders the list and every row, even rows whose data did not change. If the list passes only IDs and each row reads its own data, a write re-renders only the row that shows it, and the list does not re-render.

### Incorrect

```tsx
// BAD: the list reads collections for its rows and passes them down.
const applications = useSelector((state: RootState) => state.applications.byID);
const customers = useSelector((state: RootState) => state.customers.byID);

<FlatList
    data={applicationIDs}
    extraData={[applications, customers]}
    renderItem={({item}) => (
        <ApplicationRow
            application={applications[item]}
            customers={customers}
        />
    )}
/>;
```

### Correct

```tsx
// GOOD: the list passes only the ID, and the row reads its own data.
<FlatList
    data={applicationIDs}
    renderItem={({item}) => <ApplicationRow applicationID={item} />}
/>;

function ApplicationRow({applicationID}: ApplicationRowProps) {
    const application = useSelector((state: RootState) => state.applications.byID[applicationID]);
    const customer = useSelector((state: RootState) =>
        application?.customerID ? state.customers.byID[application.customerID] : undefined,
    );
    // ...
}
```

### Not a violation

```tsx
// The list needs the whole collection to sort and filter, and passes only IDs to rows.
const applications = useSelector((state: RootState) => state.applications.byID);
const applicationIDs = useMemo(() => getSortedApplicationIDs(applications), [applications]);

<FlatList
    data={applicationIDs}
    renderItem={({item}) => <ApplicationRow applicationID={item} />}
/>;
```

---

### Review Metadata

**Flag when ALL of these are true:**

- A list component reads a store collection (e.g., a whole Redux slice or `byID` map), or another value that holds data for every record.
- It passes members or the whole value to rows as props, or puts it in `extraData`.
- The row could read that data itself by ID (e.g., `useSelector((state) => state.x.byID[id])`), from an ID it already receives.

**DO NOT flag if:**

- The list uses the collection only for its own work, such as sorting or filtering, and passes rows only IDs.
- The value is shared data that every row needs, not the row's own item.
- The list is not virtualized and renders only a few fixed items.

**Search Patterns** (hints for reviewers):
- `extraData`
- `renderItem`
- `useSelector` returning a whole slice or `byID` map in a list component
