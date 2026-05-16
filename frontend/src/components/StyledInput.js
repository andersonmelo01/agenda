import React from 'react';

function StyledInput({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      {label}
      <input {...props} style={{ width: '100%', marginTop: 4 }} />
    </label>
  );
}

export default StyledInput;
