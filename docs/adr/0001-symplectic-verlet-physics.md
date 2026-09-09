# 0001: Symplectic Velocity Verlet Integration for N-Body Gravity

Standard Euler or Runge-Kutta numerical integrators introduce artificial energy drift into gravitational N-body simulations, causing stable orbits to rapidly spiral inwards or fling outwards over time. We decided to implement Velocity Verlet (symplectic) integration because it preserves phase-space volume and conserves angular momentum and orbital energy over long simulation lifespans, ensuring long-term stable planetary orbits.
