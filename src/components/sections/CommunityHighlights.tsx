import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  ArrowRight, 
  Award, 
  Globe, 
  Heart,
  MessageSquare,
  TrendingUp,
  Users
} from 'lucide-react';

const discussions = [
  {
    id: 1,
    title: "Transitioning from Corporate to Entrepreneurship",
    author: "Emily Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80",
    replies: 24,
    likes: 156,
  },
  {
    id: 2,
    title: "Building Resilience in Leadership",
    author: "Marcus Johnson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80",
    replies: 18,
    likes: 92,
  },
  {
    id: 3,
    title: "Work-Life Balance in the Digital Age",
    author: "Sarah Miller",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80",
    replies: 31,
    likes: 203,
  }
];

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Members",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: MessageSquare,
    value: "50,000+",
    label: "Discussions",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: Globe,
    value: "45+",
    label: "Countries",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Award,
    value: "95%",
    label: "Success Rate",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function CommunityHighlights() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-20 bg-gray-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Join Our Thriving Community</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with coaches and peers, share experiences, and grow together in our supportive community
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid lg:grid-cols-2 gap-12"
        >
          {/* Active Discussions */}
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Trending Discussions</h3>
                  <Button
                    href="/community"
                    variant="ghost"
                    className="text-brand-600"
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {discussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={discussion.avatar}
                        alt={discussion.author}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 hover:text-brand-600">
                          <a href={`/community/discussion/${discussion.id}`}>
                            {discussion.title}
                          </a>
                        </h4>
                        <p className="text-sm text-gray-600">
                          Started by {discussion.author}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {discussion.replies} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {discussion.likes} likes
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Community Stats */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat) => (
                <Card key={stat.label} className="text-center" hover>
                  <Card.Body>
                    <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            <Card className="bg-brand-600 text-white">
              <Card.Body className="text-center">
                <h3 className="text-xl font-semibold mb-4">
                  Ready to Join Our Community?
                </h3>
                <p className="mb-6 text-brand-50">
                  Connect with fellow professionals, share insights, and accelerate your growth
                </p>
                <Button
                  href="/get-started"
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto"
                  icon={<ArrowRight className="h-5 w-5" />}
                >
                  Get Started
                </Button>
              </Card.Body>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}