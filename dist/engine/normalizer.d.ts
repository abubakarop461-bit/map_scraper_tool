import { RawLeadRecord } from '../types.js';
export declare function normalizeRecord(raw: RawLeadRecord, requestedFields?: string[]): Record<string, any>;
export declare function normalizeLeadList(rawList: RawLeadRecord[], requestedFields?: string[]): Record<string, any>[];
