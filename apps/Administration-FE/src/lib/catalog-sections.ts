export type CatalogColumn =
  | { key: string; labelKey: string; kind: 'text' | 'state' | 'date' | 'media' | 'seo' | 'format' }
  | { key: string; labelKey: string; kind: 'count'; namesKey: string };

export type CatalogField =
  | { kind: 'text' | 'email' | 'textarea' | 'number' | 'checkbox' | 'date' | 'richtext'; key: string; labelKey: string; required?: boolean }
  | { kind: 'slug'; key: string; labelKey: string; fromKey: string; required?: boolean }
  | { kind: 'select'; key: string; labelKey: string; options: string[] }
  | { kind: 'media'; key: string; labelKey: string; accept?: string }
  | { kind: 'multiselect'; key: string; idsKey: string; labelKey: string; optionsFrom: 'applications' | 'news_categories' | 'authors' | 'resource_categories'; manageView: string }
  | { kind: 'seo' }
  | { kind: 'images' };

export const RESUME_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx';

export type CatalogSection = {
  resource: string;
  segment: string;
  listView: string;
  formView: string;
  ns: string;
  path: string;
  idParam: string;
  columns: CatalogColumn[];
  fields: CatalogField[];
};

export const CATALOG_SECTIONS: CatalogSection[] = [
  {
    resource: 'applications',
    segment: 'applications',
    listView: 'applications',
    formView: 'application_form',
    ns: 'admin.applications',
    path: '/admin/applications',
    idParam: 'application_id',
    columns: [
      { key: 'resume_format', labelKey: 'resume', kind: 'format' },
      { key: 'name', labelKey: 'name', kind: 'text' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'media', key: 'resume_key', labelKey: 'resume', accept: RESUME_ACCEPT },
      { kind: 'text', key: 'name', labelKey: 'name', required: true },
      { kind: 'text', key: 'last_name', labelKey: 'last_name', required: true },
      { kind: 'email', key: 'email', labelKey: 'email', required: true },
      { kind: 'text', key: 'phone', labelKey: 'phone' },
      { kind: 'checkbox', key: 'opened', labelKey: 'opened' },
      { kind: 'number', key: 'current_ctc', labelKey: 'current_ctc' },
      { kind: 'number', key: 'expected_ctc', labelKey: 'expected_ctc' },
      { kind: 'number', key: 'notice_period', labelKey: 'notice_period' },
      { kind: 'number', key: 'experience', labelKey: 'experience' },
      { kind: 'textarea', key: 'additional_info', labelKey: 'additional_info' },
    ],
  },
  {
    resource: 'openings',
    segment: 'openings',
    listView: 'openings',
    formView: 'opening_form',
    ns: 'admin.openings',
    path: '/admin/openings',
    idParam: 'opening_id',
    columns: [
      { key: 'job_id', labelKey: 'job_id', kind: 'text' },
      { key: 'exp_date', labelKey: 'exp_date', kind: 'date' },
      { key: 'role', labelKey: 'role', kind: 'text' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'text', key: 'job_id', labelKey: 'job_id', required: true },
      { kind: 'date', key: 'exp_date', labelKey: 'exp_date' },
      { kind: 'text', key: 'role', labelKey: 'role', required: true },
      { kind: 'slug', key: 'slug', labelKey: 'slug', fromKey: 'role', required: true },
      { kind: 'text', key: 'experience', labelKey: 'experience' },
      {
        kind: 'select',
        key: 'location',
        labelKey: 'location',
        options: ['Kochi', 'Saudi Arabia', 'Hybrid', 'Remote'],
      },
      { kind: 'select', key: 'job_type', labelKey: 'job_type', options: ['Full-Time', 'Part-Time', 'Contract'] },
      { kind: 'select', key: 'job_status', labelKey: 'job_status', options: ['Opening Soon', 'Ongoing'] },
      {
        kind: 'select',
        key: 'specialization',
        labelKey: 'specialization',
        options: ['Frontend', 'Backend', 'DevOps', 'Testing', 'BDE', 'CMS', 'FullStack', 'UI/UX', 'IT Recruiter'],
      },
      {
        kind: 'multiselect',
        key: 'applications',
        idsKey: 'application_ids',
        labelKey: 'applications',
        optionsFrom: 'applications',
        manageView: 'applications',
      },
      { kind: 'richtext', key: 'body', labelKey: 'body' },
    ],
  },
  {
    resource: 'employee_testimonials',
    segment: 'employee-testimonials',
    listView: 'employee_testimonials',
    formView: 'employee_testimonial_form',
    ns: 'admin.employee_testimonials',
    path: '/admin/employee-testimonials',
    idParam: 'testimonial_id',
    columns: [
      { key: 'name', labelKey: 'name', kind: 'text' },
      { key: 'designation', labelKey: 'designation', kind: 'text' },
      { key: 'image_key', labelKey: 'image', kind: 'media' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'text', key: 'name', labelKey: 'name', required: true },
      { kind: 'text', key: 'designation', labelKey: 'designation' },
      { kind: 'textarea', key: 'review', labelKey: 'review', required: true },
      { kind: 'media', key: 'image_key', labelKey: 'image' },
      { kind: 'number', key: 'order', labelKey: 'order' },
      { kind: 'checkbox', key: 'listed', labelKey: 'listed' },
      { kind: 'date', key: 'publish_date', labelKey: 'publish_date' },
    ],
  },
  {
    resource: 'email_configuration',
    segment: 'email-configuration',
    listView: 'email_configuration',
    formView: 'email_configuration_form',
    ns: 'admin.email_configuration',
    path: '/admin/email-configuration',
    idParam: 'config_id',
    columns: [
      { key: 'smtp_default_from', labelKey: 'smtp_default_from', kind: 'text' },
      { key: 'smtp_default_reply_to', labelKey: 'smtp_default_reply_to', kind: 'text' },
      { key: 'smtp_admin_email', labelKey: 'smtp_admin_email', kind: 'text' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'email', key: 'smtp_default_from', labelKey: 'smtp_default_from', required: true },
      { kind: 'email', key: 'smtp_default_reply_to', labelKey: 'smtp_default_reply_to', required: true },
      { kind: 'email', key: 'smtp_admin_email', labelKey: 'smtp_admin_email', required: true },
    ],
  },
  {
    resource: 'email_templates',
    segment: 'email-templates',
    listView: 'email_templates',
    formView: 'email_template_form',
    ns: 'admin.email_templates',
    path: '/admin/email-templates',
    idParam: 'template_id',
    columns: [
      { key: 'slug', labelKey: 'slug', kind: 'text' },
      { key: 'type', labelKey: 'type', kind: 'text' },
      { key: 'subject', labelKey: 'subject', kind: 'text' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'richtext', key: 'body', labelKey: 'body' },
      { kind: 'text', key: 'slug', labelKey: 'slug', required: true },
      { kind: 'select', key: 'type', labelKey: 'type', options: ['user_notification', 'admin_notification'] },
      { kind: 'text', key: 'subject', labelKey: 'subject', required: true },
    ],
  },
  {
    resource: 'news_categories',
    segment: 'news-categories',
    listView: 'news_categories',
    formView: 'news_category_form',
    ns: 'admin.news_categories',
    path: '/admin/news-categories',
    idParam: 'item_id',
    columns: [
      { key: 'name', labelKey: 'name', kind: 'text' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [{ kind: 'text', key: 'name', labelKey: 'name', required: true }],
  },
  {
    resource: 'news',
    segment: 'news',
    listView: 'news',
    formView: 'news_form',
    ns: 'admin.news',
    path: '/admin/news',
    idParam: 'news_id',
    columns: [
      { key: 'seo', labelKey: 'seo', kind: 'seo' },
      { key: 'slug', labelKey: 'slug', kind: 'text' },
      { key: 'news_categories', labelKey: 'news_categories', kind: 'count', namesKey: 'news_category_names' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'text', key: 'title', labelKey: 'field.title', required: true },
      { kind: 'slug', key: 'slug', labelKey: 'slug', fromKey: 'title', required: true },
      { kind: 'richtext', key: 'body', labelKey: 'body' },
      {
        kind: 'multiselect',
        key: 'news_categories',
        idsKey: 'news_category_ids',
        labelKey: 'news_categories',
        optionsFrom: 'news_categories',
        manageView: 'news_categories',
      },
      {
        kind: 'multiselect',
        key: 'authors',
        idsKey: 'author_ids',
        labelKey: 'authors',
        optionsFrom: 'authors',
        manageView: 'authors',
      },
      { kind: 'media', key: 'image_key', labelKey: 'image' },
      { kind: 'textarea', key: 'description', labelKey: 'description' },
      { kind: 'text', key: 'button_name', labelKey: 'button_name' },
      { kind: 'number', key: 'reading_time', labelKey: 'reading_time' },
      { kind: 'text', key: 'facebook', labelKey: 'facebook' },
      { kind: 'text', key: 'linkedin', labelKey: 'linkedin' },
      { kind: 'text', key: 'twitter', labelKey: 'twitter' },
      { kind: 'text', key: 'instagram', labelKey: 'instagram' },
      { kind: 'text', key: 'youtube_url', labelKey: 'youtube_url' },
      { kind: 'seo' },
    ],
  },
  {
    resource: 'resource_categories',
    segment: 'resource-categories',
    listView: 'resource_categories',
    formView: 'resource_category_form',
    ns: 'admin.resource_categories',
    path: '/admin/resource-categories',
    idParam: 'item_id',
    columns: [
      { key: 'name', labelKey: 'name', kind: 'text' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [{ kind: 'text', key: 'name', labelKey: 'name', required: true }],
  },
  {
    resource: 'resources',
    segment: 'resources',
    listView: 'resources',
    formView: 'resource_form',
    ns: 'admin.resources',
    path: '/admin/resources',
    idParam: 'resource_id',
    columns: [
      { key: 'seo', labelKey: 'seo', kind: 'seo' },
      { key: 'created_at', labelKey: 'created_at', kind: 'date' },
      { key: 'image_key', labelKey: 'image', kind: 'media' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'media', key: 'image_key', labelKey: 'image' },
      { kind: 'number', key: 'reading_time', labelKey: 'reading_time' },
      { kind: 'text', key: 'title', labelKey: 'field.title', required: true },
      { kind: 'slug', key: 'slug', labelKey: 'slug', fromKey: 'title', required: true },
      { kind: 'text', key: 'button_name', labelKey: 'button_name' },
      { kind: 'media', key: 'pdf_key', labelKey: 'pdf', accept: 'application/pdf,.pdf' },
      {
        kind: 'multiselect',
        key: 'resource_categories',
        idsKey: 'resource_category_ids',
        labelKey: 'resource_categories',
        optionsFrom: 'resource_categories',
        manageView: 'resource_categories',
      },
      { kind: 'seo' },
    ],
  },
  {
    resource: 'memberships',
    segment: 'memberships',
    listView: 'memberships',
    formView: 'membership_form',
    ns: 'admin.memberships',
    path: '/admin/memberships',
    idParam: 'membership_id',
    columns: [
      { key: 'title', labelKey: 'field.title', kind: 'text' },
      { key: 'images', labelKey: 'images', kind: 'text' },
      { key: 'seo_title', labelKey: 'seo_title', kind: 'text' },
      { key: 'state', labelKey: 'state', kind: 'state' },
    ],
    fields: [
      { kind: 'text', key: 'title', labelKey: 'field.title', required: true },
      { kind: 'textarea', key: 'description', labelKey: 'description' },
      { kind: 'images' },
      { kind: 'seo' },
    ],
  },
];

export function catalogByView(view: string): CatalogSection | undefined {
  return CATALOG_SECTIONS.find((item) => item.listView === view || item.formView === view);
}

export function isCatalogFormView(view: string): boolean {
  return CATALOG_SECTIONS.some((item) => item.formView === view);
}
