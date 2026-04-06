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
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=80',
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
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80',
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
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1920&q=80',
    buttonText: '联系我们',
    link: '/contact',
    order: 3,
    isActive: true,
  },
];

// Default Products
export const defaultProducts: Product[] = [
  {
    id: '1',
    name: '海藻提取物',
    category: '海洋生物制品',
    description: '采用先进提取技术，从深海海藻中提取高纯度活性成分，广泛应用于食品、化妆品和医药领域。',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    specs: [
      { name: '纯度', value: '≥95%' },
      { name: '外观', value: '深绿色粉末' },
      { name: '包装', value: '25kg/桶' },
      { name: '保质期', value: '24个月' },
    ],
    features: ['高纯度提取', '天然无添加', '易溶于水', '稳定性好'],
    isActive: true,
    order: 1,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: '鱼胶原蛋白肽',
    category: '海洋生物制品',
    description: '从深海鱼类中提取的高纯度胶原蛋白肽，分子量小，易吸收，是理想的美容养颜原料。',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
    specs: [
      { name: '分子量', value: '1000-3000Da' },
      { name: '蛋白质含量', value: '≥90%' },
      { name: '包装', value: '20kg/袋' },
      { name: '保质期', value: '24个月' },
    ],
    features: ['小分子易吸收', '高纯度', '无腥味', '溶解性好'],
    isActive: true,
    order: 2,
    createdAt: '2024-01-02',
  },
  {
    id: '3',
    name: '深海鱼油',
    category: '健康食材',
    description: '源自深海冷水鱼类，富含EPA和DHA，是优质的营养补充剂原料。',
    image: 'https://images.unsplash.com/photo-1519709042477-8de6eaf1fdc5?w=600&q=80',
    specs: [
      { name: 'EPA含量', value: '≥30%' },
      { name: 'DHA含量', value: '≥20%' },
      { name: '包装', value: '190kg/桶' },
      { name: '保质期', value: '24个月' },
    ],
    features: ['高纯度Omega-3', '低氧化值', '无重金属', 'TG型结构'],
    isActive: true,
    order: 3,
    createdAt: '2024-01-03',
  },
  {
    id: '4',
    name: '海鲜干货',
    category: '水产深加工',
    description: '精选优质海鲜原料，采用传统工艺与现代技术相结合，保留海鲜的鲜美口感。',
    image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&q=80',
    specs: [
      { name: '水分', value: '≤15%' },
      { name: '盐分', value: '≤8%' },
      { name: '包装', value: '500g/袋' },
      { name: '保质期', value: '12个月' },
    ],
    features: ['传统工艺', '原汁原味', '营养丰富', '便于储存'],
    isActive: true,
    order: 4,
    createdAt: '2024-01-04',
  },
  {
    id: '5',
    name: '虾青素',
    category: '海洋生物制品',
    description: '从雨生红球藻中提取的天然虾青素，是强效的天然抗氧化剂。',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&q=80',
    specs: [
      { name: '含量', value: '≥5%' },
      { name: '外观', value: '深红色粉末' },
      { name: '包装', value: '1kg/袋' },
      { name: '保质期', value: '24个月' },
    ],
    features: ['天然提取', '高活性', '强抗氧化', '稳定性好'],
    isActive: true,
    order: 5,
    createdAt: '2024-01-05',
  },
  {
    id: '6',
    name: '海洋酵素',
    category: '海洋生物制品',
    description: '采用深海微生物发酵技术生产的复合酵素，具有多种生物活性。',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&q=80',
    specs: [
      { name: '酶活力', value: '≥10000U/g' },
      { name: '外观', value: '淡黄色粉末' },
      { name: '包装', value: '25kg/桶' },
      { name: '保质期', value: '18个月' },
    ],
    features: ['高酶活力', '多酶复合', '低温提取', '活性稳定'],
    isActive: true,
    order: 6,
    createdAt: '2024-01-06',
  },
];

// Default News
export const defaultNews: News[] = [
  {
    id: '1',
    title: '福州蓝粮荣获"国家级高新技术企业"认定',
    summary: '凭借卓越的技术创新能力和研发投入，福州蓝粮海洋生物科技有限公司成功获得国家级高新技术企业认定。',
    content: '近日，福州蓝粮海洋生物科技有限公司凭借卓越的技术创新能力和持续的研发投入，成功获得国家级高新技术企业认定。这一荣誉是对公司多年来坚持科技创新、注重研发投入的充分肯定。\n\n作为海洋生物科技领域的领军企业，福州蓝粮始终将技术创新作为企业发展的核心驱动力。公司每年投入大量资金用于新产品研发和技术升级，目前已拥有20多项国家专利，产品远销海内外。\n\n未来，福州蓝粮将继续加大研发投入，不断提升技术创新能力，为客户提供更优质的产品和服务，为海洋生物科技产业的发展做出更大贡献。',
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
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
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80',
    website: 'http://www.qdio.ac.cn',
    description: '国内顶尖的海洋研究机构',
    isActive: true,
    order: 1,
  },
  {
    id: '2',
    name: '中国海洋大学',
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&q=80',
    website: 'http://www.ouc.edu.cn',
    description: '国家重点综合性海洋大学',
    isActive: true,
    order: 2,
  },
  {
    id: '3',
    name: '福建省水产研究所',
    logo: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=200&q=80',
    description: '福建省水产科研权威机构',
    isActive: true,
    order: 3,
  },
  {
    id: '4',
    name: '福建农林大学',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&q=80',
    website: 'http://www.fafu.edu.cn',
    description: '福建省重点农业大学',
    isActive: true,
    order: 4,
  },
  {
    id: '5',
    name: '福州大学',
    logo: 'https://images.unsplash.com/photo-1592280771883-1cfae86b4321?w=200&q=80',
    website: 'http://www.fzu.edu.cn',
    description: '国家211工程重点大学',
    isActive: true,
    order: 5,
  },
  {
    id: '6',
    name: '福建省海洋与渔业局',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80',
    description: '福建省海洋渔业主管部门',
    isActive: true,
    order: 6,
  },
  {
    id: '7',
    name: '中国水产科学研究院',
    logo: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=200&q=80',
    website: 'http://www.cafs.ac.cn',
    description: '国家级水产科研机构',
    isActive: true,
    order: 7,
  },
  {
    id: '8',
    name: '福建省食品工业协会',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80',
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
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80',
    features: ['高纯度提取', '先进工艺', '品质稳定', '定制服务'],
    isActive: true,
    order: 1,
  },
  {
    id: '2',
    name: '水产深加工',
    description: '采用先进的加工技术，将优质水产原料加工成各类高附加值产品，包括鱼油、鱼粉、海鲜干货等。',
    icon: 'Fish',
    image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&q=80',
    features: ['传统工艺', '现代技术', '品质保证', '多样产品'],
    isActive: true,
    order: 2,
  },
  {
    id: '3',
    name: '健康食材供应',
    description: '为食品企业提供优质海洋健康食材原料，包括深海鱼油、海洋蛋白、海藻纤维等。',
    icon: 'Apple',
    image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&q=80',
    features: ['天然健康', '营养丰富', '安全可靠', '溯源体系'],
    isActive: true,
    order: 3,
  },
  {
    id: '4',
    name: '原料供应服务',
    description: '为化妆品、保健品、医药等行业提供高品质海洋原料，支持定制化开发和生产。',
    icon: 'Ship',
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=600&q=80',
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
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80',
      date: '2024-01',
      issuer: '科技部、财政部、税务总局',
    },
    {
      id: '2',
      title: 'ISO22000认证',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
      date: '2022-06',
      issuer: 'SGS通标标准技术服务有限公司',
    },
    {
      id: '3',
      title: '福建省科技型企业',
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&q=80',
      date: '2021-03',
      issuer: '福建省科技厅',
    },
    {
      id: '4',
      title: '福州市农业产业化龙头企业',
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80',
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
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
      bio: '拥有20年海洋生物科技行业经验，曾任多家知名海洋企业高管。',
    },
    {
      id: '2',
      name: '李海燕',
      position: '总经理',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      bio: '工商管理硕士，具有丰富的企业管理和市场运营经验。',
    },
    {
      id: '3',
      name: '王建国',
      position: '技术总监',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      bio: '海洋生物学博士，主持多项国家级科研项目，拥有10项国家专利。',
    },
    {
      id: '4',
      name: '陈晓燕',
      position: '研发总监',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
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
      image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=400&q=80',
    },
    {
      id: '2',
      name: '超临界萃取技术',
      description: '利用超临界CO2萃取技术，实现高效、环保的海洋活性物质提取。',
      icon: 'Droplets',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=80',
    },
    {
      id: '3',
      name: '膜分离技术',
      description: '采用先进的膜分离技术，实现海洋活性物质的高效分离和纯化。',
      icon: 'Filter',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80',
    },
    {
      id: '4',
      name: '微胶囊包埋技术',
      description: '采用微胶囊包埋技术，提高海洋活性物质的稳定性和生物利用度。',
      icon: 'CircleDot',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
    },
  ],
  equipment: [
    {
      id: '1',
      name: '高效液相色谱仪',
      description: '用于海洋活性物质的分离、鉴定和定量分析。',
      image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=400&q=80',
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
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=80',
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
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80',
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
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80',
      type: '科研机构',
      description: '在海洋生物活性物质研究领域开展深度合作。',
    },
    {
      id: '2',
      name: '中国海洋大学',
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&q=80',
      type: '高校',
      description: '联合培养研究生，开展产学研合作。',
    },
    {
      id: '3',
      name: '福建省水产研究所',
      logo: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=200&q=80',
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
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
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
  // Initialize with default data
  init(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem(STORAGE_KEYS.SITE_CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(defaultSiteConfig));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BANNERS)) {
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(defaultBanners));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEWS)) {
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(defaultNews));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARTNERS)) {
      localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(defaultPartners));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAGES)) {
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(defaultPages));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NAV_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.NAV_ITEMS, JSON.stringify(defaultNavItems));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY_INFO)) {
      localStorage.setItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(defaultCompanyInfo));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RD_INFO)) {
      localStorage.setItem(STORAGE_KEYS.RD_INFO, JSON.stringify(defaultRDInfo));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(defaultServices));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(defaultStats));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_USER)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(defaultAdminUser));
    }
  },

  // Generic get/set methods
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  // Specific getters
  getSiteConfig(): SiteConfig {
    return this.get(STORAGE_KEYS.SITE_CONFIG) || defaultSiteConfig;
  },

  getBanners(): Banner[] {
    return this.get(STORAGE_KEYS.BANNERS) || defaultBanners;
  },

  getProducts(): Product[] {
    return this.get(STORAGE_KEYS.PRODUCTS) || defaultProducts;
  },

  getNews(): News[] {
    return this.get(STORAGE_KEYS.NEWS) || defaultNews;
  },

  getPartners(): Partner[] {
    return this.get(STORAGE_KEYS.PARTNERS) || defaultPartners;
  },

  getPages(): Page[] {
    return this.get(STORAGE_KEYS.PAGES) || defaultPages;
  },

  getNavItems(): NavItem[] {
    return this.get(STORAGE_KEYS.NAV_ITEMS) || defaultNavItems;
  },

  getCompanyInfo(): CompanyInfo {
    return this.get(STORAGE_KEYS.COMPANY_INFO) || defaultCompanyInfo;
  },

  getRDInfo(): RDInfo {
    return this.get(STORAGE_KEYS.RD_INFO) || defaultRDInfo;
  },

  getServices(): Service[] {
    return this.get(STORAGE_KEYS.SERVICES) || defaultServices;
  },

  getStats(): Stat[] {
    return this.get(STORAGE_KEYS.STATS) || defaultStats;
  },

  // Specific setters
  setSiteConfig(config: SiteConfig): void {
    this.set(STORAGE_KEYS.SITE_CONFIG, config);
  },

  setBanners(banners: Banner[]): void {
    this.set(STORAGE_KEYS.BANNERS, banners);
  },

  setProducts(products: Product[]): void {
    this.set(STORAGE_KEYS.PRODUCTS, products);
  },

  setNews(news: News[]): void {
    this.set(STORAGE_KEYS.NEWS, news);
  },

  setPartners(partners: Partner[]): void {
    this.set(STORAGE_KEYS.PARTNERS, partners);
  },

  setPages(pages: Page[]): void {
    this.set(STORAGE_KEYS.PAGES, pages);
  },

  setNavItems(items: NavItem[]): void {
    this.set(STORAGE_KEYS.NAV_ITEMS, items);
  },

  setCompanyInfo(info: CompanyInfo): void {
    this.set(STORAGE_KEYS.COMPANY_INFO, info);
  },

  setRDInfo(info: RDInfo): void {
    this.set(STORAGE_KEYS.RD_INFO, info);
  },

  setServices(services: Service[]): void {
    this.set(STORAGE_KEYS.SERVICES, services);
  },

  setStats(stats: Stat[]): void {
    this.set(STORAGE_KEYS.STATS, stats);
  },

  // Auth methods
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
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.init();
  },
};

export default DataStore;
