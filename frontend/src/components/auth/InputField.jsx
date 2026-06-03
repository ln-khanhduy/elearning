import { useState } from "react";

function InputField({label,type,placeholder,icon,value,onChange,}) {
  const [showPassword, setShowPassword] =useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-3">
      {label && (<label className="form-label fw-semibold">{label}</label>)}
      <div className="input-group">
        {/* Icon trái */}
        <span className="input-group-text bg-white">
          <i className={`bi ${icon}`}></i>
        </span>
        {/* Input */}
        <input type={ isPassword ? (showPassword ? "text" : "password") : type }
          className="form-control" placeholder={placeholder} value={value} onChange={onChange} />
        {/* Toggle password */}
        {isPassword && ( <button type="button" className="input-group-text bg-white" onClick={() => setShowPassword(!showPassword) } >
          <i className={`bi ${ showPassword ? "bi-eye-slash" : "bi-eye" }`} ></i></button> )}
      </div>
    </div>
  );
}

export default InputField;