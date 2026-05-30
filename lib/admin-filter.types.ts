export type AdminFilterFieldType = 'string' | 'select' | 'range';

export interface IAdminFilterSelectOption {
  value: string;
  label: string;
}

export interface IAdminFilterFieldBase {
  key: string;
  label: string;
  mongoField?: string;
}

export interface IAdminFilterStringField extends IAdminFilterFieldBase {
  type: 'string';
  matchMode: 'exact' | 'partial';
  placeholder?: string;
  maxLength?: number;
}

export interface IAdminFilterSelectField extends IAdminFilterFieldBase {
  type: 'select';
  options: IAdminFilterSelectOption[];
  defaultIncludesNull?: string;
  valueType?: 'string' | 'boolean';
}

export interface IAdminFilterRangeField extends IAdminFilterFieldBase {
  type: 'range';
  min?: number;
  max?: number;
}

export type IAdminFilterField =
  | IAdminFilterStringField
  | IAdminFilterSelectField
  | IAdminFilterRangeField;

export interface IAdminFilterSearchConfig {
  key: 'search';
  label: string;
  placeholder: string;
  mongoFields: string[];
}

export interface IAdminFilterSchema {
  resource: string;
  label: string;
  search?: IAdminFilterSearchConfig;
  fields: IAdminFilterField[];
}

export type AdminFilterValues = Record<string, string>;
