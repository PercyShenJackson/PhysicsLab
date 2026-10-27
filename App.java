
import java.util.Locale;

public class App {

    static class Point {
        final double time;
        final double x;
        final double y;
        final double vx;
        final double vy;

        Point(double time, double x, double y, double vx, double vy) {
            this.time = time;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
        }
    }

    static class ProjectileSimulation {
        private final double speed;
        private final double angleDegrees;
        private final double gravity;

        ProjectileSimulation(
                double speed,
                double angleDegrees,
                double gravity) {

            if (!Double.isFinite(speed)
                    || !Double.isFinite(angleDegrees)
                    || !Double.isFinite(gravity)) {
                throw new IllegalArgumentException(
                    "Les paramètres doivent être finis."
                );
            }

            if (speed <= 0 || speed > 1000) {
                throw new IllegalArgumentException(
                    "La vitesse doit être entre 0 et 1000 m/s."
                );
            }

            if (angleDegrees < 1 || angleDegrees > 89) {
                throw new IllegalArgumentException(
                    "L'angle doit être entre 1 et 89 degrés."
                );
            }

            if (gravity < 0.01 || gravity > 100) {
                throw new IllegalArgumentException(
                    "La gravité doit être entre 0.01 et 100 m/s²."
                );
            }

            this.speed = speed;
            this.angleDegrees = angleDegrees;
            this.gravity = gravity;
        }

        double getVx() {
            return speed * Math.cos(Math.toRadians(angleDegrees));
        }

        double getVy0() {
            return speed * Math.sin(Math.toRadians(angleDegrees));
        }

        double getFlightTime() {
            return 2 * getVy0() / gravity;
        }

        double getMaxHeight() {
            return getVy0() * getVy0() / (2 * gravity);
        }

        double getRange() {
            return getVx() * getFlightTime();
        }

        Point calculatePoint(double t) {
            double vx = getVx();
            double vy0 = getVy0();

            double x = vx * t;
            double y = vy0 * t - 0.5 * gravity * t * t;
            double vy = vy0 - gravity * t;

            return new Point(t, x, Math.max(0, y), vx, vy);
        }

        void printTrajectory(int steps) {
            double flightTime = getFlightTime();

            System.out.println("\nTrajectoire :");
            System.out.printf(
                "%10s %12s %12s %12s %12s%n",
                "Temps", "X", "Y", "Vx", "Vy"
            );

            for (int i = 0; i <= steps; i++) {
                double t = flightTime * i / steps;
                Point p = calculatePoint(t);

                System.out.printf(
                    Locale.US,
                    "%10.3f %12.3f %12.3f %12.3f %12.3f%n",
                    p.time, p.x, p.y, p.vx, p.vy
                );
            }
        }

        void printResults() {
            System.out.println("================================");
            System.out.println("          PHYSICSLAB");
            System.out.println("================================");

            System.out.printf(
                Locale.US, "Vitesse initiale : %.2f m/s%n", speed
            );

            System.out.printf(
                Locale.US, "Angle : %.2f degrés%n", angleDegrees
            );

            System.out.printf(
                Locale.US, "Gravité : %.2f m/s²%n", gravity
            );

            System.out.printf(
                Locale.US, "Vitesse horizontale : %.3f m/s%n", getVx()
            );

            System.out.printf(
                Locale.US, "Vitesse verticale initiale : %.3f m/s%n",
                getVy0()
            );

            System.out.printf(
                Locale.US, "Temps de vol : %.3f s%n", getFlightTime()
            );

            System.out.printf(
                Locale.US, "Hauteur maximale : %.3f m%n", getMaxHeight()
            );

            System.out.printf(
                Locale.US, "Portée : %.3f m%n", getRange()
            );
        }
    }

    public static void main(String[] args) {
        try {
            double speed = 25.0;
            double angle = 45.0;
            double gravity = 9.81;

            ProjectileSimulation simulation =
                new ProjectileSimulation(speed, angle, gravity);

            simulation.printResults();
            simulation.printTrajectory(20);

        } catch (IllegalArgumentException error) {
            System.err.println("Erreur : " + error.getMessage());
        }
    }
}
