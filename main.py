import matplotlib.pyplot as plt
import json

with open("data.json", "r") as f:
	data = json.load(f)

print(data)

densities = [item['density'] for item in data]
print(densities)

speeds = [item['speed'] for item in data]

plt.plot(densities, speeds, '.')
plt.ylabel("speed")
plt.xlabel("density ")
plt.show()


