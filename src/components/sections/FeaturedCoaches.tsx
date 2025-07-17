import { ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const featuredCoaches = [
  {
    id: 1,
    name: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80',
    specialty: 'Career Transitions & Leadership Development',
    rating: 4.9,
    price: 150,
  },
  {
    id: 2,
    name: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
    specialty: 'Executive Coaching & Team Development',
    rating: 4.8,
    price: 175,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    image: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
    specialty: 'Personal Growth & Life Balance',
    rating: 4.9,
    price: 135,
  },
];

export function FeaturedCoaches() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Top-Rated Coaches</h2>
          <Link 
            to="/coaches" 
            className="text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredCoaches.map((coach) => (
            <Card key={coach.id} hover variant="default">
              <img
                src={coach.image}
                alt={coach.name}
                className="w-full h-48 object-cover"
              />
              <Card.Body>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{coach.name}</h3>
                  <div className="flex items-center text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-gray-600 text-sm ml-1">{coach.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {coach.specialty}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-brand-600 font-semibold">
                    ${coach.price}/session
                  </span>
                  <Button
                    href={`/coaches/${coach.id}`}
                    variant="primary"
                    size="sm"
                  >
                    View Profile
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}