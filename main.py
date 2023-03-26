import matplotlib.pyplot as plt
import json

def plot(densities, speeds, particle_count):
	plt.plot(densities, speeds, '.')
	plt.ylabel("speed")
	plt.xlabel("density")
	plt.title(f"Fundamental Diagram of particle boids ({particle_count} particles)")
	plt.show()

with open("data200.json", "r") as f:
	data = json.load(f)

densities200 = [item['density'] for item in data]
speeds200 = [item['speed'] for item in data]

plot(densities200, speeds200, '200')




