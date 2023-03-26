import matplotlib.pyplot as plt
import json


def plot(densities, speeds, particle_count):
	plt.plot(densities, speeds, '.')
	plt.ylabel("speed")
	plt.xlabel("density")
	plt.title(f"Fundamental Diagram of particle boids ({particle_count} particles)")
	plt.show()


with open("data200.json", "r") as f:
	data200 = json.load(f)

densities200 = [item['density'] for item in data200]
speeds200 = [item['speed'] for item in data200]

plot(densities200, speeds200, '200')

with open("data500.json", "r") as f:
	data500 = json.load(f)

densities500 = [item['density'] for item in data500]
speeds500 = [item['speed'] for item in data500]

plot(densities500, speeds500, '500')

