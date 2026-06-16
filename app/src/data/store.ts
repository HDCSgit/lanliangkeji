import type {
  SiteConfig,
  Banner,
  Product,
  News,
  Partner,
  Page,
  AdminUser,
  NavItem,
  CompanyInfo,
  RDInfo,
  Service,
  Stat,
} from '@/types';
import { apiGet, apiPut, apiPost, apiDelete } from '@/api/client';

// Default Site Configuration
export const defaultSiteConfig: SiteConfig = {
  title: '福州蓝粮海洋生物科技有限公司',
  logo: '/logo.png',
  favicon: '/favicon.ico',
  description: '专注于海洋生物科技研发、水产深加工与健康食材供应的企业',
  keywords: '海洋生物科技,水产加工,海藻提取物,鱼胶原蛋白肽,深海鱼油,福州蓝粮',
  icp: '闽ICP备2024000000号-1',
  analytics: '',
  contact: {
    address: '福建省福州市马尾区 Seafood Industrial Park 88号',
    phone: '0591-88888888',
    email: 'contact@lanliang-marine.com',
    fax: '0591-88888889',
    workHours: '周一至周五 8:30-17:30',
    mapLat: 26.0614,
    mapLng: 119.4543,
  },
  seo: {
    title: '福州蓝粮海洋生物科技有限公司 - 海洋生物科技领导者',
    description: '专注于海洋生物科技研发、水产深加工与健康食材供应，拥有先进的生产设备和完善的质量管理体系。',
    keywords: '海洋生物科技,水产加工,海藻提取物,鱼胶原蛋白肽,深海鱼油',
    ogImage: '/og-image.jpg',
  },
};

// Default Banners
export const defaultBanners: Banner[] = [
  {
    id: '1',
    title: '探索海洋的无限可能',
    subtitle: '海洋生物科技领导者',
    description: '致力于海洋生物科技研发、水产深加工与健康食材供应，为客户提供安全、健康、优质的海洋产品',
    image: '/images/banners/banner-1.jpg',
    buttonText: '了解更多',
    link: '/about',
    order: 1,
    isActive: true,
  },
  {
    id: '2',
    title: '创新科技 品质保障',
    subtitle: '20+项国家专利',
    description: '拥有先进的生产设备和完善的质量管理体系，产品远销海内外',
    image: '/images/banners/banner-2.jpg',
    buttonText: '查看产品',
    link: '/products',
    order: 2,
    isActive: true,
  },
  {
    id: '3',
    title: '可持续发展 绿色海洋',
    subtitle: '环保生产理念',
    description: '坚持绿色环保生产理念，实现海洋资源的可持续利用',
    image: '/images/banners/banner-3.jpg',
    buttonText: '联系我们',
    link: '/contact',
    order: 3,
    isActive: true,
  },
];

// Default Products
// 空数组:产品由管理员在后管创建;API 失败时不再用硬编码示例兜底,避免显示与生产不符的产品
export const defaultProducts: Product[] = [];

// Default News
export const defaultNews: News[] = [
  {
    id: '1',
    title: '福州蓝粮荣获"国家级高新技术企业"认定',
    summary: '凭借卓越的技术创新能力和研发投入，福州蓝粮海洋生物科技有限公司成功获得国家级高新技术企业认定。',
    content: '近日，福州蓝粮海洋生物科技有限公司凭借卓越的技术创新能力和持续的研发投入，成功获得国家级高新技术企业认定。这一荣誉是对公司多年来坚持科技创新、注重研发投入的充分肯定。\n\n作为海洋生物科技领域的领军企业，福州蓝粮始终将技术创新作为企业发展的核心驱动力。公司每年投入大量资金用于新产品研发和技术升级，目前已拥有20多项国家专利，产品远销海内外。\n\n未来，福州蓝粮将继续加大研发投入，不断提升技术创新能力，为客户提供更优质的产品和服务，为海洋生物科技产业的发展做出更大贡献。',
    image: '/images/news/news-1.jpg',
    category: '公司新闻',
    author: ' admin',
    views: 1256,
    isActive: true,
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
  },
  {
    id: '2',
    title: '公司新研发中心正式投入使用',
    summary: '投资5000万元建设的新研发中心正式投入使用，标志着公司研发实力迈上新台阶。',
    content: '经过两年的精心建设，福州蓝粮海洋生物科技有限公司新研发中心正式投入使用。该研发中心总投资5000万元，占地面积5000平方米，配备了国际先进的研发设备和检测仪器。\n\n新研发中心的投入使用，将大大提升公司的研发能力和创新水平。中心设有海洋生物提取实验室、产品研发中心、质量检测中心等多个功能区域，可满足从基础研究到产品开发的全程需求。\n\n公司表示，新研发中心的建成是公司发展史上的重要里程碑，将为公司未来发展提供强有力的技术支撑。',
    image: '/images/news/news-2.jpg',
    category: '公司动态',
    author: ' admin',
    views: 986,
    isActive: true,
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
  },
  {
    id: '3',
    title: '蓝粮海洋与中科院海洋研究所签署战略合作协议',
    summary: '双方将在海洋生物科技领域开展深度合作，共同推动行业技术进步。',
    content: '福州蓝粮海洋生物科技有限公司与中国科学院海洋研究所正式签署战略合作协议。双方将在海洋生物科技领域开展深度合作，共同推动行业技术进步和产业升级。\n\n根据协议，双方将在海洋活性物质提取、海洋生物制品开发、海洋资源可持续利用等领域开展联合研究。中科院海洋研究所将为蓝粮海洋提供技术支持和人才培养，蓝粮海洋将为研究所提供产业化平台和市场资源。\n\n此次合作是产学研结合的典范，将有力推动海洋生物科技产业的发展，为海洋经济的高质量发展做出贡献。',
    image: '/images/news/news-3.jpg',
    category: '合作新闻',
    author: ' admin',
    views: 1452,
    isActive: true,
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05',
  },
  {
    id: '4',
    title: '公司参展2024中国国际海洋产业博览会',
    summary: '蓝粮海洋携多款创新产品亮相博览会，获得广泛关注。',
    content: '2024中国国际海洋产业博览会在青岛国际会展中心盛大开幕。福州蓝粮海洋生物科技有限公司携多款创新产品亮相博览会，获得广泛关注和好评。\n\n本次展会，蓝粮海洋展示了海藻提取物、鱼胶原蛋白肽、深海鱼油等多款核心产品，吸引了众多国内外客户的关注。公司技术人员现场为客户详细介绍产品特性和应用场景，获得客户一致好评。\n\n通过本次展会，蓝粮海洋进一步提升了品牌知名度和影响力，与多家国内外客户达成合作意向，为公司开拓新市场奠定了良好基础。',
    image: '/images/news/news-4.jpg',
    category: '行业展会',
    author: ' admin',
    views: 1123,
    isActive: true,
    createdAt: '2024-02-28',
    updatedAt: '2024-02-28',
  },
  {
    id: '5',
    title: '蓝粮海洋通过ISO22000食品安全管理体系认证',
    summary: '公司质量管理体系再上新台阶，产品质量得到国际认可。',
    content: '福州蓝粮海洋生物科技有限公司顺利通过ISO22000食品安全管理体系认证，标志着公司质量管理体系达到国际先进水平。\n\nISO22000是国际标准化组织制定的食品安全管理体系标准，是全球公认的食品安全管理最高标准。通过该认证，表明蓝粮海洋在食品安全管理方面达到了国际先进水平，产品质量得到国际认可。\n\n公司表示，将以通过ISO22000认证为新起点，继续加强质量管理，不断提升产品质量和安全水平，为客户提供更优质的产品和服务。',
    image: '/images/news/news-5.jpg',
    category: '资质认证',
    author: ' admin',
    views: 876,
    isActive: true,
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20',
  },
  {
    id: '6',
    title: '公司新产品"海洋活性肽"正式上市',
    summary: '历时三年研发，具有自主知识产权的创新产品正式上市。',
    content: '经过三年的潜心研发，福州蓝粮海洋生物科技有限公司具有自主知识产权的创新产品"海洋活性肽"正式上市。\n\n海洋活性肽是蓝粮海洋研发团队从深海鱼类中提取的小分子肽类物质，具有多种生物活性。该产品采用公司自主研发的低温酶解技术，最大程度保留了活性肽的生物活性。\n\n该产品可广泛应用于功能性食品、保健品、化妆品等领域，具有广阔的市场前景。公司已获得该产品的国家发明专利，拥有完全的自主知识产权。\n\n海洋活性肽的上市，标志着蓝粮海洋在海洋生物制品领域又迈出了重要一步，将进一步丰富公司的产品线，提升公司的市场竞争力。',
    image: '/images/news/news-6.jpg',
    category: '产品发布',
    author: ' admin',
    views: 1567,
    isActive: true,
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
  },
];

// Default Partners
export const defaultPartners: Partner[] = [
  {
    id: '1',
    name: '中国科学院海洋研究所',
    logo: '/images/partners/partner-1.jpg',
    website: 'http://www.qdio.ac.cn',
    description: '国内顶尖的海洋研究机构',
    isActive: true,
    order: 1,
  },
  {
    id: '2',
    name: '中国海洋大学',
    logo: '/images/partners/partner-2.jpg',
    website: 'http://www.ouc.edu.cn',
    description: '国家重点综合性海洋大学',
    isActive: true,
    order: 2,
  },
  {
    id: '3',
    name: '福建省水产研究所',
    logo: '/images/partners/partner-3.jpg',
    description: '福建省水产科研权威机构',
    isActive: true,
    order: 3,
  },
  {
    id: '4',
    name: '福建农林大学',
    logo: '/images/partners/partner-4.jpg',
    website: 'http://www.fafu.edu.cn',
    description: '福建省重点农业大学',
    isActive: true,
    order: 4,
  },
  {
    id: '5',
    name: '福州大学',
    logo: '/images/partners/partner-5.jpg',
    website: 'http://www.fzu.edu.cn',
    description: '国家211工程重点大学',
    isActive: true,
    order: 5,
  },
  {
    id: '6',
    name: '福建省海洋与渔业局',
    logo: '/images/partners/partner-1.jpg',
    description: '福建省海洋渔业主管部门',
    isActive: true,
    order: 6,
  },
  {
    id: '7',
    name: '中国水产科学研究院',
    logo: '/images/partners/partner-3.jpg',
    website: 'http://www.cafs.ac.cn',
    description: '国家级水产科研机构',
    isActive: true,
    order: 7,
  },
  {
    id: '8',
    name: '福建省食品工业协会',
    logo: '/images/partners/partner-6.jpg',
    description: '福建省食品行业组织',
    isActive: true,
    order: 8,
  },
];

// Default Navigation
export const defaultNavItems: NavItem[] = [
  {
    id: '1',
    name: '首页',
    link: '/',
    isActive: true,
    order: 1,
  },
  {
    id: '2',
    name: '关于我们',
    link: '/about',
    isActive: true,
    order: 2,
    children: [
      {
        id: '2-1',
        name: '公司简介',
        link: '/about#company',
        isActive: true,
        order: 1,
      },
      {
        id: '2-2',
        name: '企业文化',
        link: '/about#culture',
        isActive: true,
        order: 2,
      },
      {
        id: '2-3',
        name: '发展历程',
        link: '/about#history',
        isActive: true,
        order: 3,
      },
      {
        id: '2-4',
        name: '资质荣誉',
        link: '/about#honors',
        isActive: true,
        order: 4,
      },
    ],
  },
  {
    id: '3',
    name: '产品中心',
    link: '/products',
    isActive: true,
    order: 3,
  },
  {
    id: '4',
    name: '研发实力',
    link: '/rd',
    isActive: true,
    order: 4,
  },
  {
    id: '5',
    name: '新闻资讯',
    link: '/news',
    isActive: true,
    order: 5,
  },
  {
    id: '6',
    name: '联系我们',
    link: '/contact',
    isActive: true,
    order: 6,
  },
];

// Default Stats
export const defaultStats: Stat[] = [
  {
    id: '1',
    name: '行业经验',
    value: 10,
    suffix: '+年',
    description: '深耕海洋生物科技领域',
    icon: 'Clock',
  },
  {
    id: '2',
    name: '国家专利',
    value: 20,
    suffix: '+项',
    description: '自主知识产权技术',
    icon: 'Award',
  },
  {
    id: '3',
    name: '合作伙伴',
    value: 500,
    suffix: '+家',
    description: '遍布全球的合作伙伴',
    icon: 'Users',
  },
  {
    id: '4',
    name: '养殖基地',
    value: 1000,
    suffix: '+亩',
    description: '现代化养殖基地',
    icon: 'MapPin',
  },
];

// Default Services
export const defaultServices: Service[] = [
  {
    id: '1',
    name: '海洋生物制品',
    description: '专注于海洋生物活性物质的提取与开发，提供高品质的海藻提取物、鱼胶原蛋白肽、虾青素等产品。',
    icon: 'FlaskConical',
    image: '/images/services/service-1.jpg',
    features: ['高纯度提取', '先进工艺', '品质稳定', '定制服务'],
    isActive: true,
    order: 1,
  },
  {
    id: '2',
    name: '水产深加工',
    description: '采用先进的加工技术，将优质水产原料加工成各类高附加值产品，包括鱼油、鱼粉、海鲜干货等。',
    icon: 'Fish',
    image: '/images/services/service-2.jpg',
    features: ['传统工艺', '现代技术', '品质保证', '多样产品'],
    isActive: true,
    order: 2,
  },
  {
    id: '3',
    name: '健康食材供应',
    description: '为食品企业提供优质海洋健康食材原料，包括深海鱼油、海洋蛋白、海藻纤维等。',
    icon: 'Apple',
    image: '/images/services/service-3.jpg',
    features: ['天然健康', '营养丰富', '安全可靠', '溯源体系'],
    isActive: true,
    order: 3,
  },
  {
    id: '4',
    name: '原料供应服务',
    description: '为化妆品、保健品、医药等行业提供高品质海洋原料，支持定制化开发和生产。',
    icon: 'Ship',
    image: '/images/services/service-4.jpg',
    features: ['稳定供应', '品质一致', '技术支持', '灵活定制'],
    isActive: true,
    order: 4,
  },
];

// Default Company Info
export const defaultCompanyInfo: CompanyInfo = {
  name: '蓝粮海洋',
  fullName: '福州蓝粮海洋生物科技有限公司',
  slogan: '探索海洋的无限可能',
  description: '福州蓝粮海洋生物科技有限公司是一家专注于海洋生物科技研发、水产深加工与健康食材供应的企业。公司成立于2014年，总部位于福建省福州市马尾区 Seafood Industrial Park，拥有现代化的生产基地和先进的研发中心。',
  history: [
    {
      year: '2014',
      title: '公司成立',
      description: '福州蓝粮海洋生物科技有限公司正式成立，开始海洋生物科技领域的探索。',
    },
    {
      year: '2016',
      title: '首条生产线投产',
      description: '公司首条海藻提取物生产线正式投产，年产能达到500吨。',
    },
    {
      year: '2018',
      title: '获得首张专利',
      description: '公司获得首项国家发明专利，标志着技术创新能力得到认可。',
    },
    {
      year: '2020',
      title: '研发中心建成',
      description: '投资3000万元的研发中心建成投入使用，研发实力大幅提升。',
    },
    {
      year: '2022',
      title: '通过ISO认证',
      description: '公司通过ISO22000食品安全管理体系认证，质量管理达到国际水平。',
    },
    {
      year: '2024',
      title: '高新技术企业',
      description: '公司荣获国家级高新技术企业认定，技术创新能力获得国家级认可。',
    },
  ],
  honors: [
    {
      id: '1',
      title: '国家级高新技术企业',
      image: '/images/honors/honor-1.jpg',
      date: '2024-01',
      issuer: '科技部、财政部、税务总局',
    },
    {
      id: '2',
      title: 'ISO22000认证',
      image: '/images/honors/honor-2.jpg',
      date: '2022-06',
      issuer: 'SGS通标标准技术服务有限公司',
    },
    {
      id: '3',
      title: '福建省科技型企业',
      image: '/images/honors/honor-3.jpg',
      date: '2021-03',
      issuer: '福建省科技厅',
    },
    {
      id: '4',
      title: '福州市农业产业化龙头企业',
      image: '/images/honors/honor-1.jpg',
      date: '2020-09',
      issuer: '福州市农业农村局',
    },
  ],
  culture: [
    {
      id: '1',
      title: '使命',
      description: '探索海洋的无限可能，为人类健康提供优质的海洋产品。',
      icon: 'Target',
    },
    {
      id: '2',
      title: '愿景',
      description: '成为海洋生物科技领域的领导者，推动海洋资源的可持续利用。',
      icon: 'Eye',
    },
    {
      id: '3',
      title: '价值观',
      description: '创新、品质、责任、共赢。以科技创新驱动发展，以品质赢得信任。',
      icon: 'Heart',
    },
  ],
  team: [
    {
      id: '1',
      name: '张明华',
      position: '董事长',
      photo: '/images/team/team-1-chairman.jpg',
      bio: '拥有20年海洋生物科技行业经验，曾任多家知名海洋企业高管。',
    },
    {
      id: '2',
      name: '李海燕',
      position: '总经理',
      photo: '/images/team/team-2-gm.jpg',
      bio: '工商管理硕士，具有丰富的企业管理和市场运营经验。',
    },
    {
      id: '3',
      name: '王建国',
      position: '技术总监',
      photo: '/images/team/team-3-cto.jpg',
      bio: '海洋生物学博士，主持多项国家级科研项目，拥有10项国家专利。',
    },
    {
      id: '4',
      name: '陈晓燕',
      position: '研发总监',
      photo: '/images/team/team-4-rd.jpg',
      bio: '食品科学博士，专注于海洋生物活性物质的提取与应用研究。',
    },
  ],
};

// Default R&D Info
export const defaultRDInfo: RDInfo = {
  description: '公司拥有强大的研发实力，建有现代化的研发中心，配备先进的研发设备和检测仪器。研发团队由多名博士、硕士组成，在海洋生物科技领域具有深厚的技术积累。',
  technologies: [
    {
      id: '1',
      name: '低温酶解技术',
      description: '采用低温酶解工艺，最大程度保留海洋生物活性物质的生物活性。',
      icon: 'Thermometer',
      image: '/images/rd/tech-1.jpg',
    },
    {
      id: '2',
      name: '超临界萃取技术',
      description: '利用超临界CO2萃取技术，实现高效、环保的海洋活性物质提取。',
      icon: 'Droplets',
      image: '/images/rd/tech-2.jpg',
    },
    {
      id: '3',
      name: '膜分离技术',
      description: '采用先进的膜分离技术，实现海洋活性物质的高效分离和纯化。',
      icon: 'Filter',
      image: '/images/rd/tech-3.jpg',
    },
    {
      id: '4',
      name: '微胶囊包埋技术',
      description: '采用微胶囊包埋技术，提高海洋活性物质的稳定性和生物利用度。',
      icon: 'CircleDot',
      image: '/images/rd/tech-4.jpg',
    },
  ],
  equipment: [
    {
      id: '1',
      name: '高效液相色谱仪',
      description: '用于海洋活性物质的分离、鉴定和定量分析。',
      image: '/images/equipment/equip-1.jpg',
      specs: {
        型号: 'Agilent 1260',
        检测器: 'DAD、FLD、RID',
        流速范围: '0.001-10 mL/min',
      },
    },
    {
      id: '2',
      name: '气相色谱质谱联用仪',
      description: '用于挥发性海洋活性物质的分析和检测。',
      image: '/images/equipment/equip-2.jpg',
      specs: {
        型号: 'Agilent 7890B/5977A',
        质量范围: '1.6-1050 amu',
        灵敏度: '1 pg OFN S/N 1000:1',
      },
    },
    {
      id: '3',
      name: '原子吸收光谱仪',
      description: '用于海洋产品中重金属元素的分析检测。',
      image: '/images/equipment/equip-3.jpg',
      specs: {
        型号: 'PerkinElmer PinAAcle 900T',
        波长范围: '190-900 nm',
        检出限: 'ppb级',
      },
    },
  ],
  patents: [
    {
      id: '1',
      name: '一种海藻多糖的提取方法',
      number: 'ZL201810123456.7',
      date: '2018-03-15',
      type: '发明专利',
      description: '本发明公开了一种海藻多糖的高效提取方法，提取率提高30%以上。',
    },
    {
      id: '2',
      name: '一种鱼胶原蛋白肽的制备工艺',
      number: 'ZL201910234567.8',
      date: '2019-06-20',
      type: '发明专利',
      description: '本发明提供了一种鱼胶原蛋白肽的制备工艺，产品分子量分布均匀。',
    },
    {
      id: '3',
      name: '一种虾青素的提取纯化方法',
      number: 'ZL202010345678.9',
      date: '2020-09-10',
      type: '发明专利',
      description: '本发明涉及一种虾青素的高效提取纯化方法，纯度可达95%以上。',
    },
    {
      id: '4',
      name: '一种海洋酵素的制备方法',
      number: 'ZL202110456789.0',
      date: '2021-12-05',
      type: '发明专利',
      description: '本发明公开了一种海洋酵素的制备方法，酶活力高、稳定性好。',
    },
  ],
  partners: [
    {
      id: '1',
      name: '中国科学院海洋研究所',
      logo: '/images/partners/partner-1.jpg',
      type: '科研机构',
      description: '在海洋生物活性物质研究领域开展深度合作。',
    },
    {
      id: '2',
      name: '中国海洋大学',
      logo: '/images/partners/partner-2.jpg',
      type: '高校',
      description: '联合培养研究生，开展产学研合作。',
    },
    {
      id: '3',
      name: '福建省水产研究所',
      logo: '/images/partners/partner-3.jpg',
      type: '科研机构',
      description: '在水产加工技术方面开展合作研究。',
    },
  ],
};

// Default Pages
export const defaultPages: Page[] = [
  {
    id: '1',
    name: '首页',
    slug: '/',
    title: '福州蓝粮海洋生物科技有限公司',
    description: '专注于海洋生物科技研发、水产深加工与健康食材供应',
    modules: [],
    isActive: true,
    meta: {
      title: '福州蓝粮海洋生物科技有限公司 - 海洋生物科技领导者',
      description: '专注于海洋生物科技研发、水产深加工与健康食材供应，拥有先进的生产设备和完善的质量管理体系。',
      keywords: '海洋生物科技,水产加工,海藻提取物,鱼胶原蛋白肽,深海鱼油',
    },
  },
  {
    id: '2',
    name: '关于我们',
    slug: '/about',
    title: '关于我们 - 福州蓝粮海洋生物科技有限公司',
    description: '了解蓝粮海洋的企业文化、发展历程和资质荣誉',
    modules: [],
    isActive: true,
    meta: {
      title: '关于我们 - 福州蓝粮海洋生物科技有限公司',
      description: '了解蓝粮海洋的企业文化、发展历程和资质荣誉，探索我们的使命与愿景。',
      keywords: '蓝粮海洋,企业文化,发展历程,资质荣誉',
    },
  },
  {
    id: '3',
    name: '产品中心',
    slug: '/products',
    title: '产品中心 - 福州蓝粮海洋生物科技有限公司',
    description: '浏览我们的海洋生物制品、水产深加工产品和健康食材',
    modules: [],
    isActive: true,
    meta: {
      title: '产品中心 - 福州蓝粮海洋生物科技有限公司',
      description: '提供海藻提取物、鱼胶原蛋白肽、深海鱼油等多种海洋生物制品。',
      keywords: '海藻提取物,鱼胶原蛋白肽,深海鱼油,海洋生物制品',
    },
  },
  {
    id: '4',
    name: '研发实力',
    slug: '/rd',
    title: '研发实力 - 福州蓝粮海洋生物科技有限公司',
    description: '了解我们的研发技术、设备和专利成果',
    modules: [],
    isActive: true,
    meta: {
      title: '研发实力 - 福州蓝粮海洋生物科技有限公司',
      description: '拥有强大的研发实力，建有现代化的研发中心，配备先进的研发设备和检测仪器。',
      keywords: '研发实力,专利技术,海洋科技,创新研发',
    },
  },
  {
    id: '5',
    name: '新闻资讯',
    slug: '/news',
    title: '新闻资讯 - 福州蓝粮海洋生物科技有限公司',
    description: '获取蓝粮海洋的最新动态和行业资讯',
    modules: [],
    isActive: true,
    meta: {
      title: '新闻资讯 - 福州蓝粮海洋生物科技有限公司',
      description: '获取蓝粮海洋的最新动态、行业资讯和公司公告。',
      keywords: '新闻动态,行业资讯,公司公告',
    },
  },
  {
    id: '6',
    name: '联系我们',
    slug: '/contact',
    title: '联系我们 - 福州蓝粮海洋生物科技有限公司',
    description: '联系蓝粮海洋，获取更多信息',
    modules: [],
    isActive: true,
    meta: {
      title: '联系我们 - 福州蓝粮海洋生物科技有限公司',
      description: '联系蓝粮海洋，获取更多信息，我们期待与您的合作。',
      keywords: '联系我们,联系方式,合作咨询',
    },
  },
];

// Default Admin User
export const defaultAdminUser: AdminUser = {
  id: '1',
  username: 'admin',
  password: 'admin123',
  name: '系统管理员',
  avatar: '/images/team/admin-avatar.jpg',
  role: 'admin',
  createdAt: '2024-01-01',
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  SITE_CONFIG: 'lanliang_site_config',
  BANNERS: 'lanliang_banners',
  PRODUCTS: 'lanliang_products',
  NEWS: 'lanliang_news',
  PARTNERS: 'lanliang_partners',
  PAGES: 'lanliang_pages',
  NAV_ITEMS: 'lanliang_nav_items',
  COMPANY_INFO: 'lanliang_company_info',
  RD_INFO: 'lanliang_rd_info',
  SERVICES: 'lanliang_services',
  STATS: 'lanliang_stats',
  ADMIN_USER: 'lanliang_admin_user',
  IS_LOGGED_IN: 'lanliang_is_logged_in',
  CURRENT_USER: 'lanliang_current_user',
};

// Data Management Functions
export const DataStore = {
  // Initialize by loading all site data from the backend
  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await Promise.all([
        this.getSiteConfig(),
        this.getBanners(),
        this.getProducts(),
        this.getNews(),
        this.getPartners(),
        this.getPages(),
        this.getNavItems(),
        this.getCompanyInfo(),
        this.getRDInfo(),
        this.getServices(),
        this.getStats(),
      ]);
    } catch (error) {
      console.error('DataStore init failed:', error);
    }
  },

  // Specific getters (async — fetch from backend)
  async getSiteConfig(): Promise<SiteConfig> {
    try {
      return await apiGet<SiteConfig>('/site/config');
    } catch (error) {
      console.error('Failed to load site config:', error);
      return defaultSiteConfig;
    }
  },

  async getBanners(): Promise<Banner[]> {
    try {
      return await apiGet<Banner[]>('/site/banners');
    } catch (error) {
      console.error('Failed to load banners:', error);
      return defaultBanners;
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      // 后台管理:返回全量(含已下架),前端展示上架/下架状态;前端判断 isActive
      return await apiGet<Product[]>('/admin/products');
    } catch (error) {
      console.error('Failed to load products:', error);
      // 兜底:公开接口只返上架的
      try {
        return await apiGet<Product[]>('/products/');
      } catch {
        return defaultProducts;
      }
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await apiGet<Product>(`/products/${id}`);
    } catch (error) {
      console.error('Failed to load product:', error);
      return defaultProducts.find((p) => p.id === id) || null;
    }
  },

  async getNews(): Promise<News[]> {
    try {
      return await apiGet<News[]>('/site/news');
    } catch (error) {
      console.error('Failed to load news:', error);
      return defaultNews;
    }
  },

  async getNewsById(id: string): Promise<News | null> {
    try {
      return await apiGet<News>(`/site/news/${id}`);
    } catch (error) {
      console.error('Failed to load news:', error);
      return defaultNews.find((n) => n.id === id) || null;
    }
  },

  async getPartners(): Promise<Partner[]> {
    try {
      return await apiGet<Partner[]>('/site/partners');
    } catch (error) {
      console.error('Failed to load partners:', error);
      return defaultPartners;
    }
  },

  async getPages(): Promise<Page[]> {
    try {
      return await apiGet<Page[]>('/site/pages');
    } catch (error) {
      console.error('Failed to load pages:', error);
      return defaultPages;
    }
  },

  async getPageBySlug(slug: string): Promise<Page | null> {
    try {
      return await apiGet<Page>(`/site/pages/${slug}`);
    } catch (error) {
      console.error('Failed to load page:', error);
      return defaultPages.find((p) => p.slug === slug) || null;
    }
  },

  async getNavItems(): Promise<NavItem[]> {
    try {
      return await apiGet<NavItem[]>('/site/nav');
    } catch (error) {
      console.error('Failed to load nav items:', error);
      return defaultNavItems;
    }
  },

  async getCompanyInfo(): Promise<CompanyInfo> {
    try {
      return await apiGet<CompanyInfo>('/site/company');
    } catch (error) {
      console.error('Failed to load company info:', error);
      return defaultCompanyInfo;
    }
  },

  async getRDInfo(): Promise<RDInfo> {
    try {
      return await apiGet<RDInfo>('/site/rd');
    } catch (error) {
      console.error('Failed to load R&D info:', error);
      return defaultRDInfo;
    }
  },

  async getServices(): Promise<Service[]> {
    try {
      return await apiGet<Service[]>('/site/services');
    } catch (error) {
      console.error('Failed to load services:', error);
      return defaultServices;
    }
  },

  async getStats(): Promise<Stat[]> {
    try {
      return await apiGet<Stat[]>('/site/stats');
    } catch (error) {
      console.error('Failed to load stats:', error);
      return defaultStats;
    }
  },

  // Specific setters (async — send to admin backend)
  async setSiteConfig(config: SiteConfig): Promise<void> {
    try {
      await apiPut('/admin/site/config', config);
    } catch (error) {
      console.error('Failed to save site config:', error);
      throw error;
    }
  },

  async setBanners(banners: Banner[]): Promise<void> {
    try {
      await apiPut('/admin/site/banners', banners);
    } catch (error) {
      console.error('Failed to save banners:', error);
      throw error;
    }
  },

  /**
   * 直接创建一个产品(不走 setProducts 的 diff 逻辑),返回后端的 ProductOut
   * 用于"新建模式下创建空产品后立即拿到 id,再去上传图片"的流程
   */
  async createProduct(payload: any): Promise<Product> {
    try {
      // apiPost 已自动解 ApiResponse.data
      const out = await apiPost<Product>('/products/', payload);
      return out;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  },

  /**
   * 物理删除一个产品(后端硬删 + 级联删规格)
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await apiDelete(`/products/${productId}`);
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  /**
   * 更新一个产品(包含规格、封面图等)
   */
  async updateProduct(productId: string, payload: any): Promise<Product> {
    try {
      const out = await apiPut<Product>(`/products/${productId}`, payload);
      return out;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  async setProducts(products: Product[]): Promise<void> {
    try {
      // 后端没有批量保存接口，逐个创建/更新
      const existing = await this.getProducts();
      const existingIds = new Set(existing.map((p) => p.id));
      const inputIds = new Set(products.map((p) => p.id));

      for (const product of products) {
        // 规范化价格/库存:表单可能传 null(用户清空输入框),提交时转 0
        const normalizedSpecs = product.specs.map((s) => ({
          id: s.id,
          name: s.name ?? '',
          unit: s.unit || '件',
          price: s.price ?? 0,
          stock: s.stock ?? 0,
          min_order: s.minOrder ?? 1,
          is_active: s.isActive !== false,
        }));
        const coverImages = (product.coverImages || []).filter(Boolean);
        const detailImages = (product.detailImages || []).filter(Boolean);
        const payload = {
          name: product.name,
          category: product.category,
          description: product.description ?? '',
          image: product.image ?? '',
          // 新增:封面图(1-5)、详情图(0-N)、轮播开关
          cover_images: coverImages,
          detail_images: detailImages,
          enable_carousel: !!product.enableCarousel && coverImages.length >= 2,
          features: product.features ?? [],
          // 关键:isActive 字段必须显式传布尔值,不能 undefined
          is_active: product.isActive !== false,
          order: product.order ?? 0,
          specs: normalizedSpecs,
        };
        if (existingIds.has(product.id)) {
          await apiPut(`/products/${product.id}`, payload);
        } else {
          await apiPost('/products/', payload);
        }
      }

      // 删除不在列表中的产品
      for (const p of existing) {
        if (!inputIds.has(p.id)) {
          await apiDelete(`/products/${p.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to save products:', error);
      throw error;
    }
  },

  /**
   * 上传产品图片(封面图/详情图),后端会自动加到对应列表。
   * 返回 { path, coverImages, detailImages, enableCarousel, product }
   */
  async uploadProductImage(
    productId: string,
    file: File,
    kind: 'cover' | 'detail' = 'cover',
    position?: number,
  ): Promise<{ path: string; coverImages: string[]; detailImages: string[]; enableCarousel: boolean; product: Product }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('kind', kind);
    if (position !== undefined) formData.append('position', String(position));
    const data = await apiPost<{
      id: string;
      image: string;
      cover_images: string[];
      detail_images: string[];
      enable_carousel: boolean;
      product: Product;
    }>(`/products/${productId}/image`, formData);
    return {
      path: data.image,
      coverImages: data.cover_images || [],
      detailImages: data.detail_images || [],
      enableCarousel: !!data.enable_carousel,
      product: data.product,
    };
  },

  /**
   * 从产品的 cover_images / detail_images 中移除一张图片(不删除磁盘文件)
   */
  async removeProductImage(
    productId: string,
    imageUrl: string,
    kind: 'cover' | 'detail' = 'cover',
  ): Promise<{ coverImages: string[]; detailImages: string[]; enableCarousel: boolean; product: Product }> {
    const data = await apiDelete<{
      id: string;
      cover_images: string[];
      detail_images: string[];
      enable_carousel: boolean;
      product: Product;
    }>(`/products/${productId}/image?kind=${kind}&image_url=${encodeURIComponent(imageUrl)}`);
    return {
      coverImages: data.cover_images || [],
      detailImages: data.detail_images || [],
      enableCarousel: !!data.enable_carousel,
      product: data.product,
    };
  },

  /**
   * 重排 cover_images / detail_images(拖拽排序)
   */
  async reorderProductImages(
    productId: string,
    kind: 'cover' | 'detail',
    urls: string[],
  ): Promise<{ coverImages: string[]; detailImages: string[]; enableCarousel: boolean; product: Product }> {
    const params = new URLSearchParams();
    params.set('kind', kind);
    urls.forEach((u) => params.append('urls', u));
    const data = await apiPut<{
      id: string;
      cover_images: string[];
      detail_images: string[];
      enable_carousel: boolean;
      product: Product;
    }>(`/products/${productId}/images/reorder?${params.toString()}`);
    return {
      coverImages: data.cover_images || [],
      detailImages: data.detail_images || [],
      enableCarousel: !!data.enable_carousel,
      product: data.product,
    };
  },

  /**
   * 切换产品封面图轮播(只有 ≥2 张封面图才会真正开启)
   */
  async toggleProductCarousel(
    productId: string,
    enable: boolean,
  ): Promise<{ enableCarousel: boolean }> {
    const data = await apiPut<{ id: string; enable_carousel: boolean }>(
      `/products/${productId}/carousel?enable=${enable ? 'true' : 'false'}`,
    );
    return { enableCarousel: !!data.enable_carousel };
  },

  async setNews(news: News[]): Promise<void> {
    try {
      await apiPut('/admin/site/news', news);
    } catch (error) {
      console.error('Failed to save news:', error);
      throw error;
    }
  },

  async setPartners(partners: Partner[]): Promise<void> {
    try {
      await apiPut('/admin/site/partners', partners);
    } catch (error) {
      console.error('Failed to save partners:', error);
      throw error;
    }
  },

  async setPages(pages: Page[]): Promise<void> {
    try {
      await apiPut('/admin/site/pages', pages);
    } catch (error) {
      console.error('Failed to save pages:', error);
      throw error;
    }
  },

  async setNavItems(items: NavItem[]): Promise<void> {
    try {
      await apiPut('/admin/site/nav', items);
    } catch (error) {
      console.error('Failed to save nav items:', error);
      throw error;
    }
  },

  async setCompanyInfo(info: CompanyInfo): Promise<void> {
    try {
      await apiPut('/admin/site/company', info);
    } catch (error) {
      console.error('Failed to save company info:', error);
      throw error;
    }
  },

  async setRDInfo(info: RDInfo): Promise<void> {
    try {
      await apiPut('/admin/site/rd', info);
    } catch (error) {
      console.error('Failed to save R&D info:', error);
      throw error;
    }
  },

  async setServices(services: Service[]): Promise<void> {
    try {
      await apiPut('/admin/site/services', services);
    } catch (error) {
      console.error('Failed to save services:', error);
      throw error;
    }
  },

  async setStats(stats: Stat[]): Promise<void> {
    try {
      await apiPut('/admin/site/stats', stats);
    } catch (error) {
      console.error('Failed to save stats:', error);
      throw error;
    }
  },

  // Generic get/set helpers for local auth state
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  // Auth methods (local state only)
  login(username: string, password: string): boolean {
    const admin = this.get<AdminUser>(STORAGE_KEYS.ADMIN_USER);
    if (admin && admin.username === username && admin.password === password) {
      this.set(STORAGE_KEYS.IS_LOGGED_IN, true);
      this.set(STORAGE_KEYS.CURRENT_USER, admin);
      return true;
    }
    return false;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  isLoggedIn(): boolean {
    return this.get<boolean>(STORAGE_KEYS.IS_LOGGED_IN) || false;
  },

  getCurrentUser(): AdminUser | null {
    return this.get<AdminUser>(STORAGE_KEYS.CURRENT_USER);
  },

  // Reset to defaults
  reset(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    this.init();
  },

  // Contact form submission
  async submitContact(data: { name: string; phone: string; email?: string; company?: string; message: string }): Promise<void> {
    try {
      await apiPost('/contact/', data);
    } catch (error) {
      console.error('Failed to submit contact:', error);
      throw error;
    }
  },
};

export default DataStore;
