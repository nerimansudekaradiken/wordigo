CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    UserName NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL, 
    DailyWordLimit INT DEFAULT 10,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Words (
    WordID INT IDENTITY(1,1) PRIMARY KEY,
    EngWordName NVARCHAR(100) NOT NULL,
    TurWordName NVARCHAR(100) NOT NULL,
    PicturePath NVARCHAR(255),
    AudioPath NVARCHAR(255),
    ExampleSentence NVARCHAR(MAX)
);

CREATE TABLE UserProgress (
    ProgressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    WordID INT NOT NULL,
    CorrectCount INT DEFAULT 0,
    LastShownDate DATE,
    NextReviewDate DATE,
    IsLearned BIT DEFAULT 0,
    WrongAnswerCount INT DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (WordID) REFERENCES Words(WordID)
);

CREATE TABLE WordSamples (
    WordSamplesID INT IDENTITY(1,1) PRIMARY KEY,
    WordID INT NOT NULL,
    Samples NVARCHAR(MAX),
    FOREIGN KEY (WordID) REFERENCES Words(WordID)
);
