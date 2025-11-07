export enum TagStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  BLACKLISTED = 'BLACKLISTED',
}

export function fromStringToTagStatus(status: string): TagStatus {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return TagStatus.ACTIVE;
    case 'PENDING':
      return TagStatus.PENDING;
    case 'REJECTED':
      return TagStatus.REJECTED;
    case 'BLACKLISTED':
      return TagStatus.BLACKLISTED;
    default:
      throw new Error(`Invalid TagStatus string: ${status}`);
  }
}

export function fromTagStatusToString(status: TagStatus): string {
  return status;
}
