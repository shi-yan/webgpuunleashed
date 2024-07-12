import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import codecs, json 

# Define the parameters of the Gaussian function
mu = [10, 10, 10]
sigma = [[2, 2, 0], [0, 1, 0], [2, 0, 1]]

cov = [[0.46426650881767273, -0.6950497627258301, -0.7515625953674316],
       [ -0.6950497627258301, 2.0874688625335693, 1.7611732482910156],
       [ -0.7515625953674316, 1.7611732482910156, 1.7881864309310913]]



# Generate the data
X = np.random.multivariate_normal(mu, cov, 10000)

json.dump(X.tolist(), codecs.open('points.json', 'w', encoding='utf-8'), 
          separators=(',', ':'), 
          sort_keys=True, 
          indent=4)

# Create the 3D plot
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

# Plot the data
ax.scatter(X[:, 0], X[:, 1], X[:, 2], c='blue')

# Set the axes labels
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')

# Show the plot
plt.show()