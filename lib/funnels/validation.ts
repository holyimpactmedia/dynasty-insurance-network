// Field validators — defined once, copied verbatim from the original funnel
// pages (identical regex/logic across all six).

export const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 10
export const validateName = (name: string) => name.trim().length >= 2
