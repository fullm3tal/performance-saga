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
];

export default ruleCatalog;
export type {RuleDemo};
