/** The rules that have an interactive demo, in the order we walk through them. */
type RuleDemo = {
    id: string;
    title: string;
    route: string;
};

const ruleCatalog: RuleDemo[] = [
    {id: 'PERF-1', title: 'No spread in renderItem', route: '/rules/perf-1'},
    {id: 'PERF-2', title: 'Return early before expensive work', route: '/rules/perf-2'},
];

export default ruleCatalog;
export type {RuleDemo};
