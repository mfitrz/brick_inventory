namespace LegoWebApp.Models;

public record SetValueItem(int SetNumber, string Name, decimal CurrentPrice);
public record YearPrediction(int Year, decimal TotalValue);
public record VaultPrediction(decimal CurrentTotal, List<YearPrediction> Predictions);
