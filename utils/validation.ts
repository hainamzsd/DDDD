/**
 * Validation Utilities for Regulatory Compliance
 *
 * Validates data according to Vietnamese land and cadastral regulations:
 * - Land Law 2013 (Luật Đất đai 2013)
 * - Decree 43/2014/NĐ-CP
 * - Circular 02/2015/TT-BTNMT
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates location identifier format (PP-DD-CC-NNNNNN)
 *
 * Format:
 * - PP: 2-digit province code (01-96)
 * - DD: 2-digit district code (01-99)
 * - CC: 2-digit commune code (01-99)
 * - NNNNNN: 6-digit sequential number (000001-999999)
 *
 * Example: 79-02-05-000123 (Hồ Chí Minh, Quận 1, Phường Bến Nghé, #123)
 */
export function validateLocationIdentifier(identifier: string): ValidationResult {
  if (!identifier || identifier.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Mã định danh không được để trống',
    };
  }

  const pattern = /^(\d{2})-(\d{2})-(\d{2})-(\d{6})$/;
  const match = identifier.match(pattern);

  if (!match) {
    return {
      isValid: false,
      errorMessage: 'Mã định danh phải theo định dạng PP-DD-CC-NNNNNN (ví dụ: 79-02-05-000123)',
    };
  }

  const [, province, district, commune, sequence] = match;

  // Validate province code (01-96)
  const provinceCode = parseInt(province, 10);
  if (provinceCode < 1 || provinceCode > 96) {
    return {
      isValid: false,
      errorMessage: 'Mã tỉnh/thành phố không hợp lệ (phải từ 01-96)',
    };
  }

  // Validate district code (01-99)
  const districtCode = parseInt(district, 10);
  if (districtCode < 1 || districtCode > 99) {
    return {
      isValid: false,
      errorMessage: 'Mã quận/huyện không hợp lệ (phải từ 01-99)',
    };
  }

  // Validate commune code (01-99)
  const communeCode = parseInt(commune, 10);
  if (communeCode < 1 || communeCode > 99) {
    return {
      isValid: false,
      errorMessage: 'Mã phường/xã không hợp lệ (phải từ 01-99)',
    };
  }

  // Validate sequence (000001-999999)
  const sequenceNum = parseInt(sequence, 10);
  if (sequenceNum < 1 || sequenceNum > 999999) {
    return {
      isValid: false,
      errorMessage: 'Số thứ tự không hợp lệ (phải từ 000001-999999)',
    };
  }

  return { isValid: true };
}

/**
 * Validates land use type code according to Vietnamese cadastral categories
 *
 * Valid formats:
 * - NNG.*: Nông nghiệp (Agricultural)
 * - PNN.*: Phi nông nghiệp (Non-agricultural)
 * - CSD.*: Chưa sử dụng (Unused)
 *
 * Examples:
 * - NNG.LUA (Đất trồng lúa)
 * - PNN.DO.TT (Đất đô thị)
 * - PNN.SXKD.CN (Đất sản xuất kinh doanh công nghiệp)
 */
export function validateLandUseTypeCode(code: string): ValidationResult {
  if (!code || code.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Loại sử dụng đất không được để trống',
    };
  }

  // Check if code starts with valid prefix
  const validPrefixes = ['NNG.', 'PNN.', 'CSD.'];
  const hasValidPrefix = validPrefixes.some(prefix => code.startsWith(prefix));

  if (!hasValidPrefix) {
    return {
      isValid: false,
      errorMessage: 'Mã loại đất phải bắt đầu bằng NNG., PNN., hoặc CSD.',
    };
  }

  // Check code format (letters, dots, numbers allowed)
  const pattern = /^[A-Z]{3}(\.[A-Z0-9]+)+$/;
  if (!pattern.test(code)) {
    return {
      isValid: false,
      errorMessage: 'Mã loại đất không đúng định dạng (ví dụ: NNG.LUA, PNN.DO.TT)',
    };
  }

  return { isValid: true };
}

/**
 * Validates administrative unit code format
 *
 * Valid patterns:
 * - Province: PP (2 digits, 01-96)
 * - District: PP-DD (4 chars with hyphen)
 * - Commune: PP-DD-CC (7 chars with 2 hyphens)
 *
 * Examples:
 * - "79" (TP Hồ Chí Minh)
 * - "79-02" (Quận 1)
 * - "79-02-05" (Phường Bến Nghé)
 */
export function validateAdminUnitCode(code: string, level: 'province' | 'district' | 'commune'): ValidationResult {
  if (!code || code.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Mã đơn vị hành chính không được để trống',
    };
  }

  let pattern: RegExp;
  let expectedFormat: string;

  switch (level) {
    case 'province':
      pattern = /^\d{2}$/;
      expectedFormat = 'PP (2 chữ số, ví dụ: 79)';
      break;
    case 'district':
      pattern = /^\d{2}-\d{2}$/;
      expectedFormat = 'PP-DD (ví dụ: 79-02)';
      break;
    case 'commune':
      pattern = /^\d{2}-\d{2}-\d{2}$/;
      expectedFormat = 'PP-DD-CC (ví dụ: 79-02-05)';
      break;
    default:
      return {
        isValid: false,
        errorMessage: 'Cấp đơn vị hành chính không hợp lệ',
      };
  }

  if (!pattern.test(code)) {
    return {
      isValid: false,
      errorMessage: `Mã không đúng định dạng. Phải theo dạng ${expectedFormat}`,
    };
  }

  // Validate numeric ranges
  const parts = code.split('-').map(p => parseInt(p, 10));

  // Province code (01-96)
  if (parts[0] < 1 || parts[0] > 96) {
    return {
      isValid: false,
      errorMessage: 'Mã tỉnh/thành phố không hợp lệ (phải từ 01-96)',
    };
  }

  // District code (01-99)
  if (parts.length > 1 && (parts[1] < 1 || parts[1] > 99)) {
    return {
      isValid: false,
      errorMessage: 'Mã quận/huyện không hợp lệ (phải từ 01-99)',
    };
  }

  // Commune code (01-99)
  if (parts.length > 2 && (parts[2] < 1 || parts[2] > 99)) {
    return {
      isValid: false,
      errorMessage: 'Mã phường/xã không hợp lệ (phải từ 01-99)',
    };
  }

  return { isValid: true };
}

/**
 * Validates Vietnamese ID number (CMND/CCCD)
 *
 * Valid formats:
 * - CMND (old): 9 digits
 * - CCCD (new): 12 digits
 *
 * According to Circular 01/2022/TT-BCA:
 * - 12-digit CCCD format: ABC-DE-FGHIJK
 *   - ABC: Mã địa bàn nơi sinh (3 digits)
 *   - D: Giới tính và thế kỷ sinh (1 digit)
 *   - E: Năm cuối của năm sinh (1 digit)
 *   - FGHIJK: Số ngẫu nhiên (6 digits)
 */
export function validateOwnerIdNumber(idNumber: string): ValidationResult {
  if (!idNumber || idNumber.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Số CMND/CCCD không được để trống',
    };
  }

  // Remove spaces and hyphens
  const cleaned = idNumber.replace(/[\s-]/g, '');

  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      errorMessage: 'Số CMND/CCCD chỉ được chứa chữ số',
    };
  }

  // Check length (9 or 12 digits)
  if (cleaned.length !== 9 && cleaned.length !== 12) {
    return {
      isValid: false,
      errorMessage: 'Số CMND/CCCD phải có 9 chữ số (CMND cũ) hoặc 12 chữ số (CCCD mới)',
    };
  }

  return { isValid: true };
}

/**
 * Validates Vietnamese phone number
 *
 * Valid formats:
 * - Mobile: 10 digits starting with 03, 05, 07, 08, 09
 * - Landline: 10 digits starting with 02
 *
 * Can be formatted with spaces, hyphens, or parentheses
 * Examples: 0901234567, 090-123-4567, (028) 1234-5678
 */
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: true }; // Phone is optional
  }

  // Remove formatting characters
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      errorMessage: 'Số điện thoại chỉ được chứa chữ số',
    };
  }

  // Check length (must be 10 digits)
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      errorMessage: 'Số điện thoại phải có 10 chữ số',
    };
  }

  // Check valid prefix
  const validPrefixes = ['02', '03', '05', '07', '08', '09'];
  const prefix = cleaned.substring(0, 2);

  if (!validPrefixes.includes(prefix)) {
    return {
      isValid: false,
      errorMessage: 'Số điện thoại phải bắt đầu bằng 02, 03, 05, 07, 08, hoặc 09',
    };
  }

  return { isValid: true };
}

/**
 * Validates land certificate number (Số GCN QSDĐ)
 *
 * Format varies by province and year, but generally:
 * - Contains letters and numbers
 * - May include special characters like /, -
 * - Length typically 10-20 characters
 *
 * Examples:
 * - BG123456/2023
 * - 79-2023-000123
 * - HCM/2023/123456
 */
export function validateLandCertificateNumber(certNumber: string): ValidationResult {
  if (!certNumber || certNumber.trim() === '') {
    return { isValid: true }; // Certificate is optional
  }

  // Check length (reasonable range)
  if (certNumber.length < 5 || certNumber.length > 30) {
    return {
      isValid: false,
      errorMessage: 'Số GCN phải có độ dài từ 5-30 ký tự',
    };
  }

  // Check valid characters (letters, numbers, /, -, space)
  if (!/^[A-Za-z0-9\/\-\s]+$/.test(certNumber)) {
    return {
      isValid: false,
      errorMessage: 'Số GCN chỉ được chứa chữ cái, số, dấu /, và dấu -',
    };
  }

  return { isValid: true };
}

/**
 * Validates area value (land plot or building area)
 *
 * Requirements:
 * - Must be a positive number
 * - Reasonable range: 1 - 1,000,000 m²
 * - Can have up to 2 decimal places
 */
export function validateArea(area: number | string, fieldName: string = 'Diện tích'): ValidationResult {
  if (area === null || area === undefined || area === '') {
    return { isValid: true }; // Area is optional
  }

  const numericArea = typeof area === 'string' ? parseFloat(area) : area;

  if (isNaN(numericArea)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số`,
    };
  }

  if (numericArea <= 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải lớn hơn 0`,
    };
  }

  if (numericArea > 1000000) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá 1,000,000 m²`,
    };
  }

  // Check decimal places (max 2)
  const decimalPart = numericArea.toString().split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return {
      isValid: false,
      errorMessage: `${fieldName} chỉ được có tối đa 2 chữ số thập phân`,
    };
  }

  return { isValid: true };
}

/**
 * Validates GPS coordinates
 *
 * Vietnam boundaries:
 * - Latitude: 8.5°N - 23.4°N
 * - Longitude: 102.1°E - 109.5°E
 */
export function validateGPSCoordinates(latitude: number, longitude: number): ValidationResult {
  // Check if coordinates are provided
  if (!latitude || !longitude) {
    return {
      isValid: false,
      errorMessage: 'Tọa độ GPS không được để trống',
    };
  }

  // Check if they are valid numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    return {
      isValid: false,
      errorMessage: 'Tọa độ GPS không hợp lệ',
    };
  }

  // Check Vietnam boundaries
  if (latitude < 8.5 || latitude > 23.4) {
    return {
      isValid: false,
      errorMessage: 'Vĩ độ phải nằm trong khoảng 8.5°N - 23.4°N (phạm vi Việt Nam)',
    };
  }

  if (longitude < 102.1 || longitude > 109.5) {
    return {
      isValid: false,
      errorMessage: 'Kinh độ phải nằm trong khoảng 102.1°E - 109.5°E (phạm vi Việt Nam)',
    };
  }

  return { isValid: true };
}

/**
 * Validates polygon vertices (minimum 3 points required for a valid polygon)
 */
export function validatePolygonVertices(vertices: Array<{ latitude: number; longitude: number }>): ValidationResult {
  if (!vertices || vertices.length === 0) {
    return { isValid: true }; // Polygon is optional
  }

  if (vertices.length < 3) {
    return {
      isValid: false,
      errorMessage: 'Đa giác phải có ít nhất 3 điểm',
    };
  }

  // Validate each vertex
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    const coordValidation = validateGPSCoordinates(vertex.latitude, vertex.longitude);

    if (!coordValidation.isValid) {
      return {
        isValid: false,
        errorMessage: `Điểm ${i + 1}: ${coordValidation.errorMessage}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates required text field
 */
export function validateRequiredText(value: string, fieldName: string, minLength: number = 1, maxLength: number = 500): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được để trống`,
    };
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải có ít nhất ${minLength} ký tự`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá ${maxLength} ký tự`,
    };
  }

  return { isValid: true };
}
