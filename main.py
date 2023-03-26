import matplotlib.pyplot as plt
import json

with open("data.json", "r") as f:
	data = json.load(f)

densities = [item['density'] for item in data]
speeds = [item['speed'] for item in data]

plt.plot(densities, speeds, '.')
plt.ylabel("speed")
plt.xlabel("density")
plt.title("Fundamental Diagram of particle boids")
plt.show()


