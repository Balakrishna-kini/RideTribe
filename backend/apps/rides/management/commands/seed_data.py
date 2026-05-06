"""
Seed the database with sample data for development.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.rides.models import Ride, RideMember
from apps.notifications.models import Notification
from apps.users.models import Vehicle
from datetime import date, time

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample RiderTribe data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create users
        users = []
        user_data = [
            ('john', 'john@ridertribe.com', 'John', 'Rider', 'Password123'),
            ('priya', 'priya@ridertribe.com', 'Priya', 'Sharma', 'Password123'),
            ('rahul', 'rahul@ridertribe.com', 'Rahul', 'Dev', 'Password123'),
            ('ankit', 'ankit@ridertribe.com', 'Ankit', 'Patel', 'Password123'),
            ('kavya', 'kavya@ridertribe.com', 'Kavya', 'Nair', 'Password123'),
        ]

        for uname, email, first, last, pwd in user_data:
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last,
                    'phone': '+91 98765 43210',
                    'bio': f'Passionate rider from India',
                    'location': 'Bangalore, India',
                }
            )
            if created:
                user.set_password(pwd)
                user.save()
                self.stdout.write(f'  Created user: {email}')
            users.append(user)

        # Create vehicles for john
        if not Vehicle.objects.filter(user=users[0]).exists():
            Vehicle.objects.create(user=users[0], name='Royal Enfield Classic 350', vehicle_type='motorcycle', mileage=35)
            Vehicle.objects.create(user=users[0], name='KTM Duke 390', vehicle_type='motorcycle', mileage=30)
            self.stdout.write('  Created vehicles for john')

        # Create rides
        rides_data = [
            {
                'title': 'Bangalore to Coorg Weekend Ride',
                'description': 'A scenic ride through the Western Ghats to the coffee paradise of Coorg. Route includes Mysore highway and ghat sections.',
                'start_location': 'Bangalore, KA',
                'end_location': 'Coorg, KA',
                'date': date(2026, 4, 5),
                'time': time(6, 0),
                'distance': 265,
                'max_members': 15,
                'status': 'upcoming',
                'organizer': users[0],
            },
            {
                'title': 'Nandi Hills Sunrise Ride',
                'description': 'Early morning ride to catch the stunning sunrise at Nandi Hills. Quick pace, great twisties!',
                'start_location': 'Bangalore, KA',
                'end_location': 'Nandi Hills, KA',
                'date': date(2026, 3, 28),
                'time': time(4, 30),
                'distance': 62,
                'max_members': 20,
                'status': 'upcoming',
                'organizer': users[1],
            },
            {
                'title': 'Coastal Karnataka Explorer',
                'description': 'A beautiful coastal road trip through pristine beaches and coconut groves of Karnataka coast.',
                'start_location': 'Mangalore, KA',
                'end_location': 'Gokarna, KA',
                'date': date(2026, 3, 15),
                'time': time(7, 0),
                'distance': 240,
                'max_members': 10,
                'status': 'completed',
                'organizer': users[2],
            },
            {
                'title': 'Ladakh Dream Ride 2026',
                'description': 'The ultimate motorcycle adventure through the highest motorable passes in the world.',
                'start_location': 'Manali, HP',
                'end_location': 'Leh, Ladakh',
                'date': date(2026, 6, 15),
                'time': time(5, 0),
                'distance': 490,
                'max_members': 8,
                'status': 'upcoming',
                'organizer': users[0],
            },
            {
                'title': 'Wayanad Monsoon Ride',
                'description': 'Ride through the misty mountains of Wayanad during the golden hour of monsoon season.',
                'start_location': 'Bangalore, KA',
                'end_location': 'Wayanad, KL',
                'date': date(2026, 4, 10),
                'time': time(6, 0),
                'distance': 280,
                'max_members': 12,
                'status': 'active',
                'organizer': users[3],
            },
            {
                'title': 'Hampi Heritage Cruise',
                'description': 'Explore the ancient ruins of Hampi on two wheels. History meets horsepower!',
                'start_location': 'Bangalore, KA',
                'end_location': 'Hampi, KA',
                'date': date(2026, 4, 20),
                'time': time(5, 30),
                'distance': 340,
                'max_members': 15,
                'status': 'upcoming',
                'organizer': users[4],
            },
        ]

        for rd in rides_data:
            ride, created = Ride.objects.get_or_create(
                title=rd['title'],
                defaults=rd,
            )
            if created:
                # Add organizer as member
                RideMember.objects.get_or_create(ride=ride, user=rd['organizer'])
                # Add some members
                for u in users[:3]:
                    if u != rd['organizer']:
                        RideMember.objects.get_or_create(ride=ride, user=u)
                self.stdout.write(f'  Created ride: {ride.title}')

        # Create notifications for john
        if not Notification.objects.filter(user=users[0]).exists():
            notifs = [
                ('Priya Sharma joined your Coorg ride', 'ride_join'),
                ('Nandi Hills ride date changed to March 28', 'ride_update'),
                ('Wayanad Monsoon Ride is now active!', 'ride_update'),
                ('Rahul Dev joined Ladakh Dream Ride', 'ride_join'),
                ('Coastal Karnataka ride completed!', 'ride_update'),
            ]
            for msg, ntype in notifs:
                Notification.objects.create(
                    user=users[0],
                    message=msg,
                    notification_type=ntype,
                )
            self.stdout.write('  Created notifications for john')

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write(f'\n  Login credentials:')
        for uname, email, first, last, pwd in user_data:
            self.stdout.write(f'    {email} / {pwd}')
