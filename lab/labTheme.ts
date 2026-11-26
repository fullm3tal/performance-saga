/** Shared colors and spacing for the rule demo screens. */
const labTheme = {
    color: {
        background: '#F5F6F8',
        card: '#FFFFFF',
        text: '#1B1D21',
        muted: '#6B7280',
        border: '#E2E5EA',
        panel: '#1B1D21',
        panelText: '#FFFFFF',
        panelMuted: '#A1A7B3',
        bad: '#D93F3F',
        badSoft: '#FDECEC',
        good: '#1E9E5A',
        goodSoft: '#E6F6EC',
        selected: '#E8F0FE',
        accent: '#2F6FED',
        flash: '#FFD54A',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
    },
    radius: 10,
} as const;

export default labTheme;
