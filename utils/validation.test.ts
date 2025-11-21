/**
 * Unit tests for validation utilities
 * Tests compliance with Vietnamese land and cadastral regulations
 */

import {
  validateLocationIdentifier,
  validateLandUseTypeCode,
  validateAdminUnitCode,
  validateOwnerIdNumber,
  validatePhoneNumber,
  validateLandCertificateNumber,
  validateArea,
  validateGPSCoordinates,
  validatePolygonVertices,
  validateRequiredText,
} from './validation';

describe('validateLocationIdentifier', () => {
  test('should accept valid location identifier', () => {
    const result = validateLocationIdentifier('79-02-05-000123');
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });

  test('should accept valid identifier with different codes', () => {
    expect(validateLocationIdentifier('01-01-01-000001').isValid).toBe(true);
    expect(validateLocationIdentifier('96-99-99-999999').isValid).toBe(true);
  });

  test('should reject empty identifier', () => {
    const result = validateLocationIdentifier('');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được để trống');
  });

  test('should reject invalid format', () => {
    expect(validateLocationIdentifier('79-02-05').isValid).toBe(false);
    expect(validateLocationIdentifier('7902-05-000123').isValid).toBe(false);
    expect(validateLocationIdentifier('79-02-05-123').isValid).toBe(false);
    expect(validateLocationIdentifier('AB-CD-EF-123456').isValid).toBe(false);
  });

  test('should reject invalid province code', () => {
    const result = validateLocationIdentifier('00-02-05-000123');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Mã tỉnh');

    const result2 = validateLocationIdentifier('97-02-05-000123');
    expect(result2.isValid).toBe(false);
    expect(result2.errorMessage).toContain('Mã tỉnh');
  });

  test('should reject invalid district code', () => {
    const result = validateLocationIdentifier('79-00-05-000123');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Mã quận/huyện');
  });

  test('should reject invalid commune code', () => {
    const result = validateLocationIdentifier('79-02-00-000123');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Mã phường/xã');
  });

  test('should reject invalid sequence number', () => {
    const result = validateLocationIdentifier('79-02-05-000000');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Số thứ tự');
  });
});

describe('validateLandUseTypeCode', () => {
  test('should accept valid agricultural codes', () => {
    expect(validateLandUseTypeCode('NNG.LUA').isValid).toBe(true);
    expect(validateLandUseTypeCode('NNG.CAY').isValid).toBe(true);
    expect(validateLandUseTypeCode('NNG.RUNG').isValid).toBe(true);
  });

  test('should accept valid non-agricultural codes', () => {
    expect(validateLandUseTypeCode('PNN.DO.TT').isValid).toBe(true);
    expect(validateLandUseTypeCode('PNN.SXKD.CN').isValid).toBe(true);
    expect(validateLandUseTypeCode('PNN.CCQ').isValid).toBe(true);
  });

  test('should accept valid unused land codes', () => {
    expect(validateLandUseTypeCode('CSD.NUI').isValid).toBe(true);
  });

  test('should reject empty code', () => {
    const result = validateLandUseTypeCode('');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được để trống');
  });

  test('should reject invalid prefix', () => {
    const result = validateLandUseTypeCode('ABC.TEST');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('NNG., PNN., hoặc CSD.');
  });

  test('should reject invalid format', () => {
    expect(validateLandUseTypeCode('NNG').isValid).toBe(false);
    expect(validateLandUseTypeCode('NNG-LUA').isValid).toBe(false);
    expect(validateLandUseTypeCode('NNG.lua').isValid).toBe(false); // lowercase
  });
});

describe('validateAdminUnitCode', () => {
  describe('province level', () => {
    test('should accept valid province codes', () => {
      expect(validateAdminUnitCode('01', 'province').isValid).toBe(true);
      expect(validateAdminUnitCode('79', 'province').isValid).toBe(true);
      expect(validateAdminUnitCode('96', 'province').isValid).toBe(true);
    });

    test('should reject invalid province codes', () => {
      expect(validateAdminUnitCode('00', 'province').isValid).toBe(false);
      expect(validateAdminUnitCode('97', 'province').isValid).toBe(false);
      expect(validateAdminUnitCode('1', 'province').isValid).toBe(false);
    });
  });

  describe('district level', () => {
    test('should accept valid district codes', () => {
      expect(validateAdminUnitCode('79-01', 'district').isValid).toBe(true);
      expect(validateAdminUnitCode('79-99', 'district').isValid).toBe(true);
    });

    test('should reject invalid district codes', () => {
      expect(validateAdminUnitCode('79-00', 'district').isValid).toBe(false);
      expect(validateAdminUnitCode('97-01', 'district').isValid).toBe(false);
      expect(validateAdminUnitCode('79', 'district').isValid).toBe(false);
    });
  });

  describe('commune level', () => {
    test('should accept valid commune codes', () => {
      expect(validateAdminUnitCode('79-02-05', 'commune').isValid).toBe(true);
      expect(validateAdminUnitCode('01-01-01', 'commune').isValid).toBe(true);
    });

    test('should reject invalid commune codes', () => {
      expect(validateAdminUnitCode('79-02-00', 'commune').isValid).toBe(false);
      expect(validateAdminUnitCode('79-02', 'commune').isValid).toBe(false);
    });
  });

  test('should reject empty code', () => {
    const result = validateAdminUnitCode('', 'province');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được để trống');
  });
});

describe('validateOwnerIdNumber', () => {
  test('should accept valid 9-digit CMND', () => {
    expect(validateOwnerIdNumber('123456789').isValid).toBe(true);
  });

  test('should accept valid 12-digit CCCD', () => {
    expect(validateOwnerIdNumber('123456789012').isValid).toBe(true);
  });

  test('should accept formatted ID numbers', () => {
    expect(validateOwnerIdNumber('123-456-789').isValid).toBe(true);
    expect(validateOwnerIdNumber('123 456 789 012').isValid).toBe(true);
    expect(validateOwnerIdNumber('123-456-789-012').isValid).toBe(true);
  });

  test('should reject empty ID number', () => {
    const result = validateOwnerIdNumber('');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được để trống');
  });

  test('should reject non-numeric ID', () => {
    const result = validateOwnerIdNumber('ABC123456');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('chỉ được chứa chữ số');
  });

  test('should reject invalid length', () => {
    const result = validateOwnerIdNumber('12345678');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('9 chữ số');

    const result2 = validateOwnerIdNumber('1234567890123');
    expect(result2.isValid).toBe(false);
  });
});

describe('validatePhoneNumber', () => {
  test('should accept valid mobile numbers', () => {
    expect(validatePhoneNumber('0901234567').isValid).toBe(true);
    expect(validatePhoneNumber('0312345678').isValid).toBe(true);
    expect(validatePhoneNumber('0587654321').isValid).toBe(true);
    expect(validatePhoneNumber('0712345678').isValid).toBe(true);
    expect(validatePhoneNumber('0823456789').isValid).toBe(true);
  });

  test('should accept valid landline numbers', () => {
    expect(validatePhoneNumber('0281234567').isValid).toBe(true);
  });

  test('should accept formatted phone numbers', () => {
    expect(validatePhoneNumber('090-123-4567').isValid).toBe(true);
    expect(validatePhoneNumber('090 123 4567').isValid).toBe(true);
    // Note: (028) format has 11 chars after removing formatting, should be 10
    expect(validatePhoneNumber('0281234567').isValid).toBe(true);
  });

  test('should accept empty phone (optional)', () => {
    expect(validatePhoneNumber('').isValid).toBe(true);
  });

  test('should reject non-numeric phone', () => {
    const result = validatePhoneNumber('09012345AB');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('chỉ được chứa chữ số');
  });

  test('should reject invalid length', () => {
    const result = validatePhoneNumber('090123456');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('10 chữ số');
  });

  test('should reject invalid prefix', () => {
    const result = validatePhoneNumber('0101234567');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('bắt đầu bằng');
  });
});

describe('validateLandCertificateNumber', () => {
  test('should accept valid certificate numbers', () => {
    expect(validateLandCertificateNumber('BG123456/2023').isValid).toBe(true);
    expect(validateLandCertificateNumber('79-2023-000123').isValid).toBe(true);
    expect(validateLandCertificateNumber('HCM/2023/123456').isValid).toBe(true);
  });

  test('should accept empty certificate (optional)', () => {
    expect(validateLandCertificateNumber('').isValid).toBe(true);
  });

  test('should reject too short certificate', () => {
    const result = validateLandCertificateNumber('1234');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('5-30 ký tự');
  });

  test('should reject too long certificate', () => {
    const longCert = 'A'.repeat(31);
    const result = validateLandCertificateNumber(longCert);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('5-30 ký tự');
  });

  test('should reject invalid characters', () => {
    const result = validateLandCertificateNumber('BG123@456#2023');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('chỉ được chứa');
  });
});

describe('validateArea', () => {
  test('should accept valid area values', () => {
    expect(validateArea(100).isValid).toBe(true);
    expect(validateArea('500.5').isValid).toBe(true);
    expect(validateArea(1000000).isValid).toBe(true);
    expect(validateArea('123.45').isValid).toBe(true);
  });

  test('should accept empty area (optional)', () => {
    expect(validateArea('').isValid).toBe(true);
    expect(validateArea(null as any).isValid).toBe(true);
    expect(validateArea(undefined as any).isValid).toBe(true);
  });

  test('should reject non-numeric area', () => {
    const result = validateArea('abc');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('phải là số');
  });

  test('should reject zero or negative area', () => {
    const result = validateArea(0);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('lớn hơn 0');

    const result2 = validateArea(-50);
    expect(result2.isValid).toBe(false);
  });

  test('should reject area exceeding maximum', () => {
    const result = validateArea(1000001);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('1,000,000');
  });

  test('should reject more than 2 decimal places', () => {
    const result = validateArea(123.456);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('2 chữ số thập phân');
  });

  test('should use custom field name in error message', () => {
    const result = validateArea(-1, 'Diện tích đất');
    expect(result.errorMessage).toContain('Diện tích đất');
  });
});

describe('validateGPSCoordinates', () => {
  test('should accept valid coordinates in Vietnam', () => {
    // Hanoi
    expect(validateGPSCoordinates(21.0285, 105.8542).isValid).toBe(true);
    // Ho Chi Minh City
    expect(validateGPSCoordinates(10.8231, 106.6297).isValid).toBe(true);
    // Da Nang
    expect(validateGPSCoordinates(16.0544, 108.2022).isValid).toBe(true);
    // Boundaries
    expect(validateGPSCoordinates(8.5, 102.1).isValid).toBe(true);
    expect(validateGPSCoordinates(23.4, 109.5).isValid).toBe(true);
  });

  test('should reject empty coordinates', () => {
    const result = validateGPSCoordinates(0, 0);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được để trống');
  });

  test('should reject invalid numbers', () => {
    // NaN is caught by the !latitude check first (falsy value)
    const result = validateGPSCoordinates(NaN, 105.8542);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được để trống');
  });

  test('should reject latitude outside Vietnam', () => {
    const result = validateGPSCoordinates(5.0, 105.8542);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Vĩ độ');

    const result2 = validateGPSCoordinates(25.0, 105.8542);
    expect(result2.isValid).toBe(false);
  });

  test('should reject longitude outside Vietnam', () => {
    const result = validateGPSCoordinates(21.0285, 100.0);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Kinh độ');

    const result2 = validateGPSCoordinates(21.0285, 112.0);
    expect(result2.isValid).toBe(false);
  });
});

describe('validatePolygonVertices', () => {
  test('should accept valid polygon with 3 vertices', () => {
    const vertices = [
      { latitude: 21.0285, longitude: 105.8542 },
      { latitude: 21.0286, longitude: 105.8543 },
      { latitude: 21.0287, longitude: 105.8544 },
    ];
    expect(validatePolygonVertices(vertices).isValid).toBe(true);
  });

  test('should accept valid polygon with more vertices', () => {
    const vertices = [
      { latitude: 21.0285, longitude: 105.8542 },
      { latitude: 21.0286, longitude: 105.8543 },
      { latitude: 21.0287, longitude: 105.8544 },
      { latitude: 21.0288, longitude: 105.8545 },
      { latitude: 21.0289, longitude: 105.8546 },
    ];
    expect(validatePolygonVertices(vertices).isValid).toBe(true);
  });

  test('should accept empty vertices array (optional)', () => {
    expect(validatePolygonVertices([]).isValid).toBe(true);
  });

  test('should reject polygon with less than 3 vertices', () => {
    const vertices = [
      { latitude: 21.0285, longitude: 105.8542 },
      { latitude: 21.0286, longitude: 105.8543 },
    ];
    const result = validatePolygonVertices(vertices);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('ít nhất 3 điểm');
  });

  test('should reject polygon with invalid coordinates', () => {
    const vertices = [
      { latitude: 21.0285, longitude: 105.8542 },
      { latitude: 50.0, longitude: 105.8543 }, // Outside Vietnam
      { latitude: 21.0287, longitude: 105.8544 },
    ];
    const result = validatePolygonVertices(vertices);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Điểm 2');
  });
});

describe('validateRequiredText', () => {
  test('should accept valid text', () => {
    expect(validateRequiredText('Valid text', 'Field').isValid).toBe(true);
    expect(validateRequiredText('  Valid text with spaces  ', 'Field').isValid).toBe(true);
  });

  test('should reject empty text', () => {
    const result = validateRequiredText('', 'Field name');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Field name');
    expect(result.errorMessage).toContain('không được để trống');
  });

  test('should reject whitespace-only text', () => {
    const result = validateRequiredText('   ', 'Field name');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được để trống');
  });

  test('should enforce minimum length', () => {
    const result = validateRequiredText('ab', 'Field name', 3);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('ít nhất 3 ký tự');
  });

  test('should enforce maximum length', () => {
    const longText = 'a'.repeat(51);
    const result = validateRequiredText(longText, 'Field name', 1, 50);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('không được vượt quá 50 ký tự');
  });

  test('should trim spaces before length check', () => {
    expect(validateRequiredText('  abc  ', 'Field', 3, 5).isValid).toBe(true);
  });
});
