import { config, fields, collection } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';
import { createElement as h, useState, useEffect } from 'react';

const sizeLabels: Record<string, string> = { small: '25%', medium: '50%', large: '75%', full: '100%' };

const customImageComponent = block({
  label: 'Advanced Image',
  schema: {
    src: fields.image({
      label: 'Image',
      directory: 'src/assets',
      publicPath: '../../assets/',
    }),
    alt: fields.text({ label: 'Alt Text (Optional)' }),
    align: fields.select({
      label: 'Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      defaultValue: 'center',
    }),
    size: fields.select({
      label: 'Size',
      options: [
        { label: 'Small (25%)', value: 'small' },
        { label: 'Medium (50%)', value: 'medium' },
        { label: 'Large (75%)', value: 'large' },
        { label: 'Full Width (100%)', value: 'full' },
      ],
      defaultValue: 'medium',
    }),
    caption: fields.text({ label: 'Caption (Optional)' }),
  },
  ContentView: function (props) {
    const align = props.value.align ?? 'center';
    const size = props.value.size ?? 'medium';
    const width = sizeLabels[size] ?? '50%';
    const flexAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
    const source: unknown = props.value.src;

    const [objectUrl, setObjectUrl] = useState('');

    useEffect(() => {
      // If the image is not saved yet, Keystatic stores it as a Uint8Array object in props.value.src.data
      if (typeof source === 'object' && source !== null && 'data' in source) {
        const imageSource = source as { data: Uint8Array | Record<string, number>; extension?: string };
        let arrayData: Uint8Array;
        if (imageSource.data instanceof Uint8Array) {
          arrayData = imageSource.data;
        } else {
          // In case it's a plain object representation of a Uint8Array
          arrayData = new Uint8Array(Object.values(imageSource.data));
        }

        const extension = imageSource.extension || 'png';
        const buffer = new ArrayBuffer(arrayData.byteLength);
        new Uint8Array(buffer).set(arrayData);
        const blob = new Blob([buffer], { type: `image/${extension}` });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);

        return () => URL.revokeObjectURL(url);
      }
    }, [source]);

    let imgSrc = '';
    if (typeof source === 'string') {
      // If already saved, it's just a string filename
      imgSrc = source.startsWith('http') || source.startsWith('blob:')
               ? source
               : `/src/assets/${source}`;
    } else if (objectUrl) {
      // Use the object URL for unsaved images
      imgSrc = objectUrl;
    }

    const imageNode = imgSrc ? h('img', {
      src: imgSrc,
      alt: props.value.alt || 'Advanced Image',
      style: {
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        display: 'block'
      }
    }) : h('div', {
      style: {
        width: '100%',
        padding: '24px',
        background: '#f1f5f9',
        border: '2px dashed #cbd5e1',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '13px',
      }
    }, '🖼️ Click "Edit" to select an image');

    return h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: flexAlign, padding: '8px 0', width: '100%' } },
      h('div', { style: { width } }, imageNode),
      props.value.caption ? h('p', { style: { fontSize: '12px', color: '#64748b', marginTop: '8px', fontStyle: 'italic', textAlign: 'center' } }, props.value.caption) : null
    );
  },
});

const commandBlockComponent = block({
  label: 'Command block',
  schema: {
    command: fields.text({ label: 'Command', multiline: true }),
    prompt: fields.text({ label: 'Prompt', defaultValue: 'Router>' }),
    title: fields.text({ label: 'Window title', defaultValue: 'Cisco IOS' }),
    showCopy: fields.checkbox({ label: 'Show copy button', defaultValue: true }),
    output: fields.text({ label: 'Example output (Optional)', multiline: true }),
  },
});

const topologyDiagramComponent = block({
  label: 'Network topology',
  schema: {
    title: fields.text({ label: 'Title', defaultValue: 'Topologi latihan' }),
    caption: fields.text({ label: 'Caption (Optional)', multiline: true }),
    leftLabel: fields.text({ label: 'Left node label', defaultValue: 'Jaringan Sumber' }),
    leftMeta: fields.text({ label: 'Left node description', defaultValue: 'LAN pengguna' }),
    leftIcon: fields.text({ label: 'Left Material Symbol', defaultValue: 'devices' }),
    centerLabel: fields.text({ label: 'Center node label', defaultValue: 'Router' }),
    centerMeta: fields.text({ label: 'Center node description', defaultValue: 'Perangkat transit' }),
    centerIcon: fields.text({ label: 'Center Material Symbol', defaultValue: 'router' }),
    rightLabel: fields.text({ label: 'Right node label', defaultValue: 'Jaringan Tujuan' }),
    rightMeta: fields.text({ label: 'Right node description', defaultValue: 'Server tujuan' }),
    rightIcon: fields.text({ label: 'Right Material Symbol', defaultValue: 'dns' }),
  },
});

const practiceCTAComponent = block({
  label: 'Practice CTA',
  schema: {
    title: fields.text({ label: 'Title', defaultValue: 'Siap menguji pemahamanmu?' }),
    description: fields.text({
      label: 'Description',
      multiline: true,
      defaultValue: 'Pakai konsep di atas pada latihan singkat sebelum melanjutkan ke lesson berikutnya.',
    }),
    href: fields.text({ label: 'Destination URL or anchor', defaultValue: '#latihan' }),
    label: fields.text({ label: 'Button label', defaultValue: 'Coba Latihan' }),
  },
});

const commandOrderComponent = block({
  label: 'Command ordering activity',
  schema: {
    activityId: fields.text({ label: 'Unique activity ID' }),
    courseSlug: fields.relationship({ label: 'Course', collection: 'courses' }),
    lessonId: fields.text({ label: 'Lesson slug' }),
    title: fields.text({ label: 'Title' }),
    description: fields.text({ label: 'Instructions', multiline: true }),
    steps: fields.array(fields.text({ label: 'Command' }), {
      label: 'Correct command order',
      itemLabel: (props) => props.value || 'New command',
    }),
    scrambledOrder: fields.array(fields.integer({ label: 'Command index' }), {
      label: 'Initial shuffled indexes (starts at 0)',
      itemLabel: (props) => `Index ${props.value}`,
    }),
    xp: fields.integer({ label: 'XP reward', defaultValue: 30 }),
  },
});

const lessonQuizComponent = block({
  label: 'Lesson quiz',
  schema: {
    activityId: fields.text({ label: 'Unique activity ID' }),
    courseSlug: fields.relationship({ label: 'Course', collection: 'courses' }),
    lessonId: fields.text({ label: 'Lesson slug' }),
    questions: fields.array(
      fields.object({
        question: fields.text({ label: 'Question', multiline: true }),
        options: fields.array(fields.text({ label: 'Answer option' }), {
          label: 'Answer options',
          itemLabel: (props) => props.value || 'New option',
        }),
        correctIndex: fields.integer({ label: 'Correct option index (starts at 0)', defaultValue: 0 }),
        explanation: fields.text({ label: 'Explanation', multiline: true }),
      }),
      {
        label: 'Questions',
        itemLabel: (props) => props.fields.question.value || 'New question',
      }
    ),
    passingScore: fields.integer({ label: 'Passing score (%)', defaultValue: 67 }),
    xp: fields.integer({ label: 'XP reward', defaultValue: 30 }),
  },
});

const knowledgeCheckComponent = block({
  label: 'Single knowledge check',
  schema: {
    activityId: fields.text({ label: 'Unique activity ID' }),
    courseSlug: fields.relationship({ label: 'Course', collection: 'courses' }),
    lessonId: fields.text({ label: 'Lesson slug' }),
    question: fields.text({ label: 'Question', multiline: true }),
    options: fields.array(fields.text({ label: 'Answer option' }), {
      label: 'Answer options',
      itemLabel: (props) => props.value || 'New option',
    }),
    correctIndex: fields.integer({ label: 'Correct option index (starts at 0)', defaultValue: 0 }),
    explanation: fields.text({ label: 'Explanation', multiline: true }),
    xp: fields.integer({ label: 'XP reward', defaultValue: 20 }),
  },
});

const mdxComponents = {
  CustomImage: customImageComponent,
  Callout: wrapper({
    label: 'Callout',
    schema: {
      type: fields.select({
        label: 'Type',
        options: [
          { label: 'Info', value: 'info' },
          { label: 'Warning', value: 'warning' },
          { label: 'Ingat Ini', value: 'remember' },
          { label: 'Kesalahan Umum', value: 'mistake' },
          { label: 'Success', value: 'success' },
          { label: 'Danger', value: 'danger' }
        ],
        defaultValue: 'info',
      }),
      title: fields.text({ label: 'Title (Optional)' })
    }
  }),
  Tabs: wrapper({
    label: 'Tabs Group',
    schema: {}
  }),
  TabItem: wrapper({
    label: 'Tab Item',
    schema: {
      label: fields.text({ label: 'Tab Label' })
    }
  }),
  CommandBlock: commandBlockComponent,
  TopologyDiagram: topologyDiagramComponent,
  PracticeCTA: practiceCTAComponent,
  KnowledgeCheck: knowledgeCheckComponent,
  LessonQuiz: lessonQuizComponent,
  CommandOrder: commandOrderComponent,
};

export default config({
  storage: {
    kind: 'local'
  },
  ui: {
    brand: {
      name: 'Phinisi Learn',
      mark: () => h('img', { src: '/logo.png', height: 32, style: { marginRight: 8 }, alt: 'Phinisi Logo' }),
    },
  },
  collections: {
    courses: collection({
      label: 'Courses',
      slugField: 'title',
      path: 'src/content/courses/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'category', 'status', 'updatedAt'],
      schema: {
        title: fields.slug({ name: { label: 'Course title' } }),
        titleEn: fields.text({ label: 'English title (Optional)' }),
        description: fields.text({ label: 'Short description', multiline: true }),
        descriptionEn: fields.text({ label: 'English description (Optional)', multiline: true }),
        category: fields.select({
          label: 'Field',
          options: [
            { label: 'Networking', value: 'networking' },
            { label: 'Linux', value: 'linux' },
            { label: 'Automation', value: 'automation' },
            { label: 'Internet of Things', value: 'iot' },
          ],
          defaultValue: 'networking',
        }),
        level: fields.select({
          label: 'Level',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
          ],
          defaultValue: 'beginner',
        }),
        status: fields.select({
          label: 'Publishing status',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Coming soon', value: 'planned' },
            { label: 'Published', value: 'published' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'draft',
        }),
        cover: fields.image({
          label: 'Course cover',
          directory: 'public/images/courses',
          publicPath: '/images/courses/',
        }),
        publishedAt: fields.date({ label: 'Published at', defaultValue: { kind: 'today' } }),
        updatedAt: fields.date({ label: 'Last updated', defaultValue: { kind: 'today' } }),
        durationHours: fields.integer({ label: 'Estimated duration (hours)', defaultValue: 1 }),
        tools: fields.array(fields.text({ label: 'Tool' }), {
          label: 'Tools used',
          itemLabel: (props) => props.value || 'New tool',
        }),
        outcomes: fields.array(
          fields.object({
            id: fields.text({ label: 'Outcome (Indonesia)' }),
            en: fields.text({ label: 'Outcome (English, Optional)' }),
          }),
          {
            label: 'Learning outcomes',
            itemLabel: (props) => props.fields.id.value || 'New outcome',
          }
        ),
        projectTitle: fields.text({ label: 'Final project title (Optional)' }),
        projectDescription: fields.text({ label: 'Final project description (Optional)', multiline: true }),
        content: fields.mdx({ label: 'Course overview (Optional)', components: mdxComponents }),
      },
    }),
    modules: collection({
      label: 'Modules',
      slugField: 'title',
      path: 'src/content/modules/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'course', 'order'],
      schema: {
        title: fields.slug({ name: { label: 'Module title' } }),
        titleEn: fields.text({ label: 'English title (Optional)' }),
        course: fields.relationship({
          label: 'Course',
          collection: 'courses',
          validation: { isRequired: true },
        }),
        order: fields.integer({ label: 'Order in course', defaultValue: 1 }),
        description: fields.text({ label: 'Description (Optional)', multiline: true }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        content: fields.mdx({ label: 'Module introduction (Optional)', components: mdxComponents }),
      },
    }),
    lessons: collection({
      label: 'Lessons',
      slugField: 'title',
      path: 'src/content/docs/**',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'course', 'module', 'order', 'draft'],
      schema: {
        title: fields.slug({ name: { label: 'Lesson title' } }),
        language: fields.select({
          label: 'Language',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Draft', description: 'Centang untuk menyembunyikan materi ini dari website', defaultValue: false }),
        course: fields.relationship({ label: 'Course (Optional)', collection: 'courses' }),
        module: fields.relationship({ label: 'Module (Optional)', collection: 'modules' }),
        description: fields.text({ label: 'Description', multiline: true }),
        order: fields.integer({ label: 'Order', defaultValue: 1 }),
        durationMinutes: fields.integer({ label: 'Estimated duration (minutes)', defaultValue: 10 }),
        icon: fields.text({ label: 'Icon (Optional)' }),
        content: fields.mdx({
          label: 'Content',
          components: mdxComponents,
        }),
      },
    }),
    blog: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        language: fields.select({
          label: 'Language',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Draft', description: 'Centang untuk menyembunyikan post ini dari website', defaultValue: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        author: fields.text({ label: 'Author', defaultValue: 'Calvin Umboh' }),
        date: fields.date({ label: 'Date', defaultValue: { kind: 'today' } }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Technology', value: 'Technology' },
            { label: 'Networking', value: 'Networking' },
            { label: 'Cloud', value: 'Cloud' },
            { label: 'Security', value: 'Security' },
            { label: 'Linux', value: 'Linux' },
          ],
          defaultValue: 'Technology',
        }),
        image: fields.image({
          label: 'Cover Image (Optional)',
          directory: 'public/images/blog',
          publicPath: '/images/blog/',
        }),
        content: fields.mdx({
          label: 'Content',
          components: mdxComponents,
        }),
      },
    }),
    paths: collection({
      label: 'Learning Paths',
      slugField: 'title',
      path: 'src/content/paths/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        titleEn: fields.text({ label: 'English title (Optional)' }),
        language: fields.select({
          label: 'Language',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Draft', description: 'Centang untuk menyembunyikan learning path ini dari website', defaultValue: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        descriptionEn: fields.text({ label: 'English description (Optional)', multiline: true }),
        category: fields.select({
          label: 'Field',
          options: [
            { label: 'Networking', value: 'networking' },
            { label: 'Linux', value: 'linux' },
            { label: 'Automation', value: 'automation' },
            { label: 'Internet of Things', value: 'iot' },
          ],
          defaultValue: 'networking',
        }),
        target: fields.text({ label: 'Target role or certification' }),
        targetEn: fields.text({ label: 'English target (Optional)' }),
        cover: fields.image({
          label: 'Learning path cover (Optional)',
          directory: 'public/images/learning-paths',
          publicPath: '/images/learning-paths/',
        }),
        courses: fields.array(
          fields.object({
            course: fields.relationship({ label: 'Course', collection: 'courses' }),
            order: fields.integer({ label: 'Order', defaultValue: 1 }),
          }),
          {
            label: 'Courses in this learning path',
            description: 'Choose existing courses and arrange their sequence.',
            itemLabel: (props) => `${props.fields.course.value ?? 'Choose course'} — #${props.fields.order.value ?? 1}`,
          }
        ),
        content: fields.mdx({
          label: 'Content',
          components: mdxComponents,
        }),
      },
    }),
  },
});
