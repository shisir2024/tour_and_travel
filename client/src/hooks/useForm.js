import { useState } from 'react';

/**
 * useForm — manages form field state and change handler
 * @param {object} initialValues  — e.g. { email: '', password: '' }
 * @returns {{ values, handleChange, reset }}
 */
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  const handleChange = e => {
    setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const reset = () => setValues(initialValues);

  return { values, handleChange, reset };
}
