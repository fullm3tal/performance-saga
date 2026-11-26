/** The rules that have an interactive demo, in the order we walk through them. */
type RuleDemo = {
    id: string;
    title: string;
    route: string;
};

const ruleCatalog: RuleDemo[] = [
    {id: 'PERF-1', title: 'No spread in renderItem', route: '/rules/perf-1'},
    {id: 'PERF-2', title: 'Return early before expensive work', route: '/rules/perf-2'},
    {id: 'PERF-5', title: 'Shallow over deep comparisons', route: '/rules/perf-5'},
    {id: 'PERF-6', title: 'Derive state from props', route: '/rules/perf-6'},
    {id: 'PERF-7', title: 'Reset via key prop', route: '/rules/perf-7'},
    {id: 'PERF-8', title: 'Handle events in handlers', route: '/rules/perf-8'},
    {id: 'PERF-9', title: 'No useEffect chains', route: '/rules/perf-9'},
    {id: 'PERF-10', title: 'No useEffect for parent communication', route: '/rules/perf-10'},
    {id: 'PERF-11', title: 'Optimize data selection', route: '/rules/perf-11'},
    {id: 'PERF-12', title: 'Prevent memory leaks', route: '/rules/perf-12'},
    {id: 'PERF-13', title: 'Hoist iterator-independent calls', route: '/rules/perf-13'},
    {id: 'PERF-14', title: 'useSyncExternalStore for stores', route: '/rules/perf-14'},
    {id: 'PERF-15', title: 'Clean up async effects', route: '/rules/perf-15'},
    {id: 'PERF-16', title: 'Guard one-time setup', route: '/rules/perf-16'},
];

export default ruleCatalog;
export type {RuleDemo};
