'use strict';

// OpenAPI 3.0 спецификация read-only API портфолио.
// Отдаётся как есть на /api/openapi.json и рендерится Swagger UI на /api-docs.
// servers.url = "/" — спека работает на любом хосте (localhost, Render и т.д.).

module.exports = {
    openapi: '3.0.3',
    info: {
        title: 'Alexey Dmitriev — Portfolio API',
        version: '1.0.0',
        description: 'Read-only JSON API портфолио: автор, навыки, образование, категории и проекты. ' +
            'Пути к изображениям и PDF возвращаются абсолютными URL.'
    },
    servers: [
        { url: '/', description: 'Текущий хост' }
    ],
    tags: [
        { name: 'Portfolio', description: 'Данные портфолио' },
        { name: 'Meta', description: 'Служебное' }
    ],
    paths: {
        '/api/author': {
            get: {
                tags: ['Portfolio'],
                summary: 'Профиль автора',
                description: 'age вычисляется из даты рождения; avatar, pdf, pdf_cv — абсолютные URL.',
                responses: {
                    200: {
                        description: 'OK',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Author' } } }
                    }
                }
            }
        },
        '/api/skills': {
            get: {
                tags: ['Portfolio'],
                summary: 'Список навыков',
                responses: {
                    200: {
                        description: 'OK',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Skill' } } } }
                    }
                }
            }
        },
        '/api/educations': {
            get: {
                tags: ['Portfolio'],
                summary: 'Образование',
                responses: {
                    200: {
                        description: 'OK',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Education' } } } }
                    }
                }
            }
        },
        '/api/categories': {
            get: {
                tags: ['Portfolio'],
                summary: 'Категории-фильтры проектов',
                responses: {
                    200: {
                        description: 'OK',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } }
                    }
                }
            }
        },
        '/api/works': {
            get: {
                tags: ['Portfolio'],
                summary: 'Места работы с вложенными проектами',
                responses: {
                    200: {
                        description: 'OK',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Work' } } } }
                    }
                }
            }
        },
        '/api/projects': {
            get: {
                tags: ['Portfolio'],
                summary: 'Плоский список проектов',
                description: 'Все активные проекты из всех компаний. Опциональный фильтр по категории.',
                parameters: [
                    {
                        name: 'category',
                        in: 'query',
                        required: false,
                        description: 'Код категории, напр. category-20 (Android).',
                        schema: { type: 'string', example: 'category-20' }
                    }
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } }
                    }
                }
            }
        },
        '/api/openapi.json': {
            get: {
                tags: ['Meta'],
                summary: 'Эта OpenAPI спецификация',
                responses: { 200: { description: 'OK' } }
            }
        }
    },
    components: {
        schemas: {
            Author: {
                type: 'object',
                properties: {
                    avatar: { type: 'string', format: 'uri', example: 'https://alex-d.onrender.com/images/i_2018.jpg' },
                    name: { type: 'string', example: 'Alexey Dmitriev' },
                    phone: { type: 'string', example: '+375 25 740 58 93' },
                    email: { type: 'string', format: 'email' },
                    age: { type: 'integer', example: 39 },
                    address: { type: 'string', example: 'Minsk, Belarus' },
                    site: { type: 'string', format: 'uri' },
                    pdf: { type: 'string', format: 'uri' },
                    pdf_cv: { type: 'string', format: 'uri' },
                    social: {
                        type: 'object',
                        properties: {
                            facebook: { type: 'string', format: 'uri' },
                            twitter: { type: 'string', format: 'uri' },
                            linkedin: { type: 'string', format: 'uri' }
                        }
                    }
                }
            },
            Skill: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Android' },
                    level: { type: 'string', example: '90%' }
                }
            },
            Education: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'BSUIR' },
                    period: { type: 'string', example: '2005 - 2010' },
                    logo: { type: 'string', format: 'uri' },
                    position0: { type: 'string' },
                    position1: { type: 'string' },
                    desc0: { type: 'string' },
                    desc1: { type: 'string' }
                }
            },
            Category: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Android' },
                    data_target: { type: 'string', example: '.category-20' },
                    active: { type: 'boolean', example: false }
                }
            },
            Project: {
                type: 'object',
                properties: {
                    enable: { type: 'boolean', example: true },
                    name: { type: 'string', example: '• Inscope - AI Search & Browser' },
                    title: { type: 'string', example: 'Inscope - AI Search & Browser' },
                    content: { type: 'string' },
                    image_main: { type: 'string', format: 'uri' },
                    image_all: { type: 'string', format: 'uri' },
                    demo_link: { type: 'string', format: 'uri' },
                    category: { type: 'array', items: { type: 'string', example: 'category-20' } },
                    company: { type: 'string', example: 'AIBY', description: 'Добавляется только в /api/projects' }
                }
            },
            Work: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'AIBY' },
                    type: { type: 'string', example: 'FULL-TIME' },
                    period: { type: 'string' },
                    position: { type: 'string' },
                    logo: { type: 'string', format: 'uri' },
                    main_specialization: { type: 'string' },
                    primary_functions: { type: 'string' },
                    projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } }
                }
            }
        }
    }
};
