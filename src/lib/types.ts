export type Banner = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  active: boolean;
};

export type BookAccess = "free" | "paid";

export type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  cover: string;
  isbn: string;
  access: BookAccess;
  readerPrice: number;
  pdfPrice: number;
  printPrice: number;
  currency: string;
  pages: number;
  language: string;
  genre: string;
  epubUrl: string;
  featured: boolean;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  cover: string;
};

export type SiteData = {
  house: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
  };
  banners: Banner[];
  books: Book[];
  faqs: Faq[];
  blog: BlogPost[];
};

export type InquiryKind = "publish" | "contact" | "order" | "hire";

export type Inquiry = {
  id: string;
  kind: InquiryKind;
  createdAt: string;
  payload: Record<string, string>;
};
