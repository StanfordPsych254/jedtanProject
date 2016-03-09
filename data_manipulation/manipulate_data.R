library(ggplot2)
library(dplyr)
library(lsr)

d <- read.csv("/Users/jedtan/Documents/win2016/psych254/jedtanProject/data_manipulation/final_results.csv")

# Note, some preprocessing is done via python script.

# Get Epoch Number
d <- d %>% filter(Block > 0) %>% mutate(epoch= floor((Trial-1)/10) + 1)

# By-Item means (get means)
overTrial <- d %>% group_by(Trial, Stimulus, epoch) %>% summarise(meanTime = mean(Time))

# Get total means on a per-epoch basis
totalMeans <- overTrial %>% group_by(Stimulus, epoch) %>% summarise(meanTime = mean(meanTime))

#%>% summarise(time = mean(meanTime))

# The first plot represents the difference between the two stimulus types in average time per epoch,
# the main plot acquired by the authors. Pilot B will extend to 5 epochs (two blocks instead)
# The second plot shows the change in meanTime by trial number

ggplot(data=totalMeans, aes(x=epoch, y=meanTime, group = Stimulus, colour = Stimulus)) +
  geom_line() +
  geom_point( size=4, shape=21, fill="white")

ggplot(data=overTrial, aes(x=Trial, y=meanTime, group = Stimulus, colour = Stimulus)) +
  geom_line() +
  geom_point( size=4, shape=21, fill="white")

# Process data for t-test (differences in stimulus, for epoch 1 data point)
epochFade <- d %>% filter(Stimulus==1, epoch==1) %>% group_by(WorkerID) %>% summarise(meanTime = mean(Time))
epochSlide <- d %>% filter(Stimulus==0, epoch==1) %>% group_by(WorkerID) %>% summarise(meanTime = mean(Time))

#Here we get the t-statistic (with p-value) as acquired by the original authors
t.test(epochFade$meanTime, epochSlide$meanTime)

#Here we get the effect size as acquired by the original authors.
cohensD(epochFade$meanTime, epochSlide$meanTime)
