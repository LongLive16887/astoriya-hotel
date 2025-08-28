// Global types for the project
export interface NavItem {
  text: string
  href: string
}

export interface Service {
  name: string
  icon: string
  color: string
}

export interface Room {
  name: string
  price: number
  image: string
  features: string[]
  buttonText: string
}

export interface BlogPost {
  title: string
  date: string
  author: string
  image: string
  content: string
}

export interface Reviewer {
  name: string
  title: string
  image: string
}

export interface Review {
  content: string
  reviewer: Reviewer
}

export interface SocialLink {
  href: string
  icon: string
}

export interface LegalLink {
  text: string
  href: string
}

export interface ResourceLink {
  text: string
  href: string
}

// Extend Window interface for AOS
declare global {
  interface Window {
    AOS: {
      init: () => void
    }
  }
}
