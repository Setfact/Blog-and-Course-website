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

    const [objectUrl, setObjectUrl] = useState('');

    useEffect(() => {
      // If the image is not saved yet, Keystatic stores it as a Uint8Array object in props.value.src.data
      if (typeof props.value.src === 'object' && props.value.src !== null && props.value.src.data) {
        let arrayData;
        if (props.value.src.data instanceof Uint8Array) {
          arrayData = props.value.src.data;
        } else {
          // In case it's a plain object representation of a Uint8Array
          arrayData = new Uint8Array(Object.values(props.value.src.data));
        }
        
        const extension = props.value.src.extension || 'png';
        const blob = new Blob([arrayData], { type: `image/${extension}` });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        
        return () => URL.revokeObjectURL(url);
      }
    }, [props.value.src]);

    let imgSrc = '';
    if (typeof props.value.src === 'string') {
      // If already saved, it's just a string filename
      imgSrc = props.value.src.startsWith('http') || props.value.src.startsWith('blob:') 
               ? props.value.src 
               : `/src/assets/${props.value.src}`;
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
  })
};

export default config({
  storage: {
    kind: 'local'
  },
  ui: {
    brand: {
      name: 'Phinisi Network',
      mark: () => h('img', { src: '/logo.png', height: 32, style: { marginRight: 8 }, alt: 'Phinisi Logo' }),
    },
  },
  collections: {
    docs: collection({
      label: 'Courses (Docs)',
      slugField: 'title',
      path: 'src/content/docs/**',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        language: fields.select({
          label: 'Language',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Draft', description: 'Centang untuk menyembunyikan materi ini dari website', defaultValue: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        order: fields.integer({ label: 'Order', defaultValue: 1 }),
        icon: fields.text({ label: 'Icon (Optional)' }),
        learningPaths: fields.array(
          fields.object({
            path: fields.relationship({
              label: 'Learning Path',
              collection: 'paths',
            }),
            order: fields.integer({
              label: 'Urutan di dalam Path ini',
              defaultValue: 1,
              description: 'Materi ini akan muncul di posisi ke-berapa dalam Learning Path tersebut?',
            }),
          }),
          {
            label: 'Learning Paths (Optional)',
            description: 'Tambahkan Path dan atur urutannya masing-masing',
            itemLabel: (props) => {
              const pathName = props.fields.path.value ?? 'Belum dipilih';
              const order = props.fields.order.value ?? 1;
              return `${pathName} — Urutan #${order}`;
            },
          }
        ),
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
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        language: fields.select({
          label: 'Language',
          options: [{ label: 'Indonesia', value: 'id' }, { label: 'English', value: 'en' }],
          defaultValue: 'id',
        }),
        draft: fields.checkbox({ label: 'Draft', description: 'Centang untuk menyembunyikan learning path ini dari website', defaultValue: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        content: fields.mdx({
          label: 'Content',
          components: mdxComponents,
        }),
      },
    }),
  },
});
