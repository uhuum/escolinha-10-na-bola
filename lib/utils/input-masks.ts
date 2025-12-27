export function formatCPF(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, "")

  // Limit to 11 digits
  const limited = numbers.slice(0, 11)

  // Apply mask: XXX.XXX.XXX-XX
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
  }
}

export function formatRG(value: string): string {
  // Remove all non-numeric characters except X
  const upperValue = value.toUpperCase()
  const characters = upperValue.replace(/[^0-9X]/g, "")

  // Limit to 10 characters (9 digits + X, or 10 digits)
  const limited = characters.slice(0, 10)

  // Apply mask: XX.XXX.XXX-X (or XX) for various RG formats
  // Support formats like: 12.345.678-9, 12.345.678-X, 12.345.67-90
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 5) {
    return `${limited.slice(0, 2)}.${limited.slice(2)}`
  } else if (limited.length <= 8) {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`
  } else {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}-${limited.slice(8)}`
  }
}

export function formatPhone(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, "")

  // Limit to 11 digits (DDD + 9 digits)
  const limited = numbers.slice(0, 11)

  // Apply mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}
