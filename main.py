import math

angleOrigin = math.atan2(400, 400)
print(angleOrigin * (180/math.pi))

otherPoint = [200, -1]
otherAngle = math.atan2(otherPoint[1], otherPoint[1])
sinO = math.sin(otherAngle)
cosO = math.cos(otherAngle)

angle2 = math.atan2(sinO, cosO) * (180/math.pi)

print(angle2)
