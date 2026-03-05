// string util file

export const formatName = (name: string): string => {
    if (!name) return "";
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
};

export const nameRegex = /^[a-zA-Z\s'-]+$/;

// Pattern: 3 digits, hyphen, 2 digits, hyphen, 4 digits
export const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;

// Pattern: 4 digits, hyphen, 2 digits, hyphen, 2 digits
export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Define the allowed values as a constant
export const ALLOWED_GENDERS = ['M', 'F'];

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const phoneRegex = /^\d{10}$/;

// Zip Code: Exactly 5 digits
export const zipRegex = /^\d{5}$/;