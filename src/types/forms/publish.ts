import { FormStepField } from "@/types/form-steps";

export interface PublishedFormAnalytics {
  views?: number;
  submissions?: number;
  lastSubmission?: Date;
  lastView?: Date;
}

export interface PublishedFormSettings {
  theme: 'light' | 'dark';
  isCustomizable?: boolean;
}

export interface FormPublishConfig {
  id?: string;
  title: string;
  description?: string;
  fields: any[];
  theme?: 'light' | 'dark';
  customization?: {
    colors?: {
      primary?: string;
    };
    logo?: {
      url?: string;
    };
  };
}

export interface PublishedForm {
  id: string;
  empresa_id: string;
  slug: string;
  status: 'published';
  isCustomizable?: boolean;
}

export interface FormPublishResponse {
  url: string;
  formId: string;
}

export interface FormUrlConfig {
  formId: string;
  slug: string;
  customDomain?: string;
  isCustomizable?: boolean;
} 