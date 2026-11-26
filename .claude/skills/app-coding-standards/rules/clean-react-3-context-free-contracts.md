---
ruleId: CLEAN-REACT-PATTERNS-3
title: Design context-free component contracts
---

## [CLEAN-REACT-PATTERNS-3] Design context-free component contracts

### Reasoning

A component's contract should expose its capabilities abstractly, not encode assumptions about how it will be used. When interfaces leak consumer-specific details, the component becomes coupled to that context and requires modification for reuse. Good contracts signal *what the component can do*, not *what the consumer needs*.

**Distinction from CLEAN-REACT-PATTERNS-2**: PATTERNS-2 ensures components fetch their own data. This rule ensures components expose abstract capabilities, not consumer-specific interfaces.

### Incorrect

#### Incorrect (contract leaks consumer assumptions)

- Callback `navigateToGuarantorEditPage(index: number)` encodes routing assumption
- `application` prop exists only to compute index for callback
- Requires modification if consumer navigates differently

```tsx
type GuarantorListFooterProps = {
    guarantors?: Guarantor[];
    navigateToGuarantorEditPage: (index: number) => void;  // Encodes routing assumption
    application: Application | undefined;
    loanProduct: LoanProduct | undefined;
};

// in ApplicationGuarantorsStep
<GuarantorListFooter
    guarantors={guarantors}
    navigateToGuarantorEditPage={navigateToGuarantorEditPage}
    application={application}
    loanProduct={loanProduct}
/>

// in GuarantorListFooter - computes value for consumer's callback
<Button
    onPress={() => navigateToGuarantorEditPage(application?.guarantors?.length ?? 0)}
    text={t('guarantors.addGuarantor')}
/>
```

#### Incorrect (coupled contracts)

- `SaveButton` interface requires knowledge of `Form`'s internals
- Neither component works independently

```tsx
function SaveButton({ getSiblingFormData }: { getSiblingFormData: () => FormData }) {
    const handleSave = () => {
        const formData = getSiblingFormData(); // Reaches into sibling
        API.save(formData);
    };
    return <Button onPress={handleSave}>Save</Button>;
}

// Parent wires siblings together
<Form ref={formRef} />
<SaveButton getSiblingFormData={() => formRef.current?.getData()} />
```

### Correct

#### Correct (abstract contract)

- Interface exposes capability: "user can add a guarantor"
- Implementation details (index computation, navigation) stay with consumer
- Component is reusable in any context needing an "add guarantor" action

```tsx
<GuarantorListFooter
    onAddGuarantor={() => {
        const nextIndex = application?.guarantors?.length ?? 0;
        navigation.navigate('GuarantorEdit', {applicationID, index: nextIndex});
    }}
/>

// in GuarantorListFooter
<Button onPress={onAddGuarantor}>{t('guarantors.addGuarantor')}</Button>
```

#### Correct (independent contracts)

- Each component has a self-contained interface
- State coordination happens at composition level

```tsx
function EditProfile() {
    const [formData, setFormData] = useState<FormData>();
    return (
        <>
            <Form onChangeFormData={setFormData} />
            <SaveButton onSave={() => API.save(formData)} />
        </>
    );
}
```

---

### Review Metadata

#### Condition

Flag ONLY when BOTH of these are true:

1. A component's interface is shaped around a specific consumer's implementation rather than abstract capabilities
2. AND at least ONE of the following manifestations is present:
   - The component receives data only to extract values for callbacks (doesn't use it for rendering)
   - Callback signatures encode consumer-specific assumptions (e.g., `(index: number) => void` for navigation)
   - The component accesses external state through refs or imperative handles

**Signs of violation:**
- Callback signatures that encode consumer assumptions: `navigateToGuarantor(index: number)` instead of `onAddGuarantor()`
- Props passed only to extract values for callbacks, not for rendering (e.g., `application` passed just to compute `guarantors.length`)
- Imperative access to external state via refs or `useImperativeHandle`
- Component requires modification to work in a different context

**DO NOT flag if:**
- Component signals events with data it naturally owns (e.g., `onChange(value)` for an input, `onSelectItem(item)` for a list)
- Callbacks are abstract actions the component can trigger (e.g., `onAddGuarantor()`, `onSubmit()`)
- State coordination happens at a higher level with clear data flow

**What makes a contract "abstract":**
- Callback describes *what happened* in component terms: `onAddGuarantor`, `onSelect`, `onChange`
- Callback does NOT describe *what consumer should do*: `navigateToGuarantor(index)`, `updateParentState(value)`
- Props are used for rendering or internal logic, not just to compute callback arguments
- Component works without modification in a different context

**Search Patterns** (hints for reviewers):
- `index: number` (in callback signatures)
- `useImperativeHandle`
- `ref`
