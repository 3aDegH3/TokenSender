export interface InputFormProps {
    label: string
    placeholder: string
    value?: string
    type?: string
    large?: boolean
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function InputForm({ label, placeholder, value, type, large, onChange }: InputFormProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-gray-300 font-medium text-sm">{label}</label>
            {large ? (
                <textarea
                    className={`bg-gray-700/30 py-2 px-3 border border-gray-600/50 placeholder:text-gray-500/50 text-gray-100 shadow-xs rounded-lg focus:ring-[4px] focus:ring-blue-500/20 focus:outline-none focus:border-blue-500/50 h-24 align-text-top backdrop-blur-sm transition-all duration-300`}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                />
            ) : (
                <input
                    className={`bg-gray-700/30 py-2 px-3 border border-gray-600/50 placeholder:text-gray-500/50 text-gray-100 shadow-xs rounded-lg focus:ring-[4px] focus:ring-blue-500/20 focus:outline-none focus:border-blue-500/50 backdrop-blur-sm transition-all duration-300`}
                    type={type}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                />
            )}
        </div>
    )
}