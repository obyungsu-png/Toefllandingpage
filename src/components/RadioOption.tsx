interface RadioOptionProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: 'sm' | 'md';
  labelClassName?: string;
}

export function RadioOption({ id, name, value, checked, onChange, label, size = 'md', labelClassName }: RadioOptionProps) {
  // Outer circle sizes
  const outerSize = size === 'sm'
    ? 'w-4 h-4 md:w-5 md:h-5'
    : 'w-5 h-5';
  const defaultLabel = size === 'sm'
    ? 'text-sm sm:text-base md:text-lg'
    : 'text-base md:text-lg';

  return (
    <label htmlFor={id} className="flex items-start gap-2 md:gap-3 cursor-pointer">
      {/* Hidden real input for accessibility & form behavior */}
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {/* Custom radio visual: single element, dot drawn via inset box-shadow */}
      <div
        className={`${outerSize} flex-shrink-0 mt-1 rounded-full border-[2px] ${
          checked ? 'border-[#0d9488] bg-[#0d9488]' : 'border-black bg-transparent'
        }`}
        style={checked ? { boxShadow: 'inset 0 0 0 2.5px white' } : undefined}
      />
      <span
        className={labelClassName || `${defaultLabel} font-['Inter',_sans-serif] text-black leading-relaxed`}
      >
        {label}
      </span>
    </label>
  );
}
