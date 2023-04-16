import matplotlib.pyplot as plt
import json


def plot(densities, speeds, title=None):
	plt.plot(densities, speeds, '.')
	plt.ylabel("speed (pixels/drawn frame)")
	plt.xlabel("density (average particles/pixel)")
	if title:
		plt.title(title)
	else:
		plt.title(f"Fundamental Diagram of varying sized boids (between 1 and 450 particles)")
	plt.show()


with open("FD_data.json", "r") as f:
	FD = json.load(f)
FD_densities = [item['density'] for item in FD]
FD_speeds = [item['speed'] for item in FD]
plot(FD_densities, FD_speeds)

with open("FD_no_align.json", "r") as f:
	FD = json.load(f)
FD_densities = [item['density'] for item in FD]
FD_speeds = [item['speed'] for item in FD]
plot(FD_densities, FD_speeds, "Fundamental Diagram of varying sized boids (between 1 and 300 particles),\n no alignment")

with open("FD_no_cohesion.json", "r") as f:
	FD = json.load(f)
FD_densities = [item['density'] for item in FD]
FD_speeds = [item['speed'] for item in FD]
plot(FD_densities, FD_speeds, "Fundamental Diagram of varying sized boids (between 1 and 300 particles),\n no cohesion")

with open("FD_no_sep.json", "r") as f:
	FD = json.load(f)
FD_densities = [item['density'] for item in FD]
FD_speeds = [item['speed'] for item in FD]
plot(FD_densities, FD_speeds, "Fundamental Diagram of varying sized boids (between 1 and 300 particles),\n no separation")

with open("FD_no_all.json", "r") as f:
	FD = json.load(f)
FD_densities = [item['density'] for item in FD]
FD_speeds = [item['speed'] for item in FD]
plot(FD_densities, FD_speeds, "Fundamental Diagram of varying sized boids (between 1 and 300 particles),\n all rules turned off")