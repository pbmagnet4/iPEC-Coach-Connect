import { Container } from './ui/Container';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

const navigation = {
  coaching: [
    { name: 'Find a Coach', href: '/coaches' },
    { name: 'Become a Coach', href: '/become-coach' },
    { name: 'How it Works', href: '/how-it-works' },
    { name: 'Pricing', href: '/pricing' },
  ],
  community: [
    { name: 'Discussion Forums', href: '/community' },
    { name: 'Events', href: '/community/events' },
    { name: 'Groups', href: '/community/groups' },
    { name: 'Success Stories', href: '/success-stories' },
  ],
  resources: [
    { name: 'About Coaching', href: '/about-coaching' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Support', href: '/support' },
    { name: 'Contact Us', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Accessibility', href: '/accessibility' },
  ],
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <Container>
        <div className="py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Coaching</h3>
              <ul className="space-y-3">
                {navigation.coaching.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.href}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <ul className="space-y-3">
                {navigation.community.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.href}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.href}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <a href="mailto:support@ipeccoach.com" className="hover:text-white transition-colors">
                    support@ipeccoach.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <a href="tel:+1-888-555-0123" className="hover:text-white transition-colors">
                    +1 (888) 555-0123
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 mt-1" />
                  <span>
                    123 Coaching Street<br />
                    New York, NY 10001
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-800">
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                >
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {navigation.legal.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="hover:text-white transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500 mt-4 md:mt-0">
              © {new Date().getFullYear()} iPEC Coach Connect. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}