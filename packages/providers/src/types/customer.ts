// Customer-related types

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: Address;
  kycStatus: KycStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface KycData {
  documentType: DocumentType;
  documentNumber: string;
  documentImage?: string;
  selfieImage?: string;
  address: Address;
  dateOfBirth: string;
}

export enum DocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  VOTERS_CARD = 'voters_card',
}

export interface KycResult {
  status: KycStatus;
  message: string;
  verificationId?: string;
  rejectionReason?: string;
}

export interface CreateCustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: Address;
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: Address;
}



