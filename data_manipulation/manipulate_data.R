library(ggplot2)
library(dplyr)
library(lsr)
library(lme4)

d <- read.csv("/Users/jedtan/Documents/win2016/psych254/jedtanProject/data_manipulation/final_results.csv")

# Note, some preprocessing is done via python script.

# Get Epoch Number
d <- d %>% filter(Block > 0) %>% mutate(epoch= floor((Trial-1)/10) + 1) %>% rename(Transition=Stimulus)
d$Transition <- factor(d$Transition, levels=c(0, 1), labels=c("Slide", "Fade"))
d$epoch <- factor(d$epoch)

# By-Item means (get means)
overTrial <- d %>% group_by(Trial, Transition, epoch) %>% summarise(meanTime = mean(Time))
overTrialEpochFlat <- d %>% group_by(WorkerID, Trial, Transition) %>% summarise(meanTime = mean(Time))

linModel <- lmer(meanTime ~ Trial * Transition + (1|WorkerID), data = overTrialEpochFlat)
predictedValues <- predict(linModel, overTrialEpochFlat)
overTrialEpochFlatWithLine <- overTrialEpochFlat %>% mutate(predicted = predictedValues)

# Get total means on a per-epoch basis
totalMeans <- overTrial %>% group_by(Transition, epoch) %>% summarise(meanTime = mean(meanTime))

#%>% summarise(time = mean(meanTime))

# The first plot represents the difference between the two stimulus types in average time per epoch,
# the main plot acquired by the authors. Pilot B will extend to 5 epochs (two blocks instead)
# The second plot shows the change in meanTime by trial number

ggplot(data=totalMeans, aes(x=epoch, y=meanTime, group = Transition, colour = Transition)) +
  geom_line() +
  geom_point( size=2, shape=21, fill="white") + labs(title = "Per Epoch Means") + xlab("Epoch") + ylab("Mean Time (ms)")

ggplot(data=overTrial, aes(x=Trial, y=meanTime, group = Transition, colour = Transition)) +
  geom_line() +
  geom_point( size=2, shape=21, fill="white") + labs(title = "Per Trial Means") + xlab("Trial") + ylab("Mean Time (ms)")

# Process data for t-test (differences in stimulus, for epoch 1 data point)
epochFade <- d %>% filter(Transition=="Fade", epoch==1) %>% group_by(WorkerID) %>% summarise(meanFadeTime = mean(Time))
epochSlide <- d %>% filter(Transition=="Slide", epoch==1) %>% group_by(WorkerID) %>% summarise(meanSlideTime = mean(Time))

bothEpochs <- epochFade %>% mutate(meanSlideTime = epochSlide$meanSlideTime) %>% summarise(meanSlideTime = mean(meanSlideTime), meanFadeTime = mean(meanFadeTime))
epochOneDiff <- epochFade$meanFadeTime[1] - epochFade$meanSlideTime[1]
#Here we get the t-statistic (with p-value) as acquired by the original authors
t.test(epochFade$meanTime, epochSlide$meanTime)

#Here we get the effect size as acquired by the original authors.
cohensD(epochFade$meanTime, epochSlide$meanTime)
