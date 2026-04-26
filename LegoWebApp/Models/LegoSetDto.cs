namespace LegoWebApp.Models;

public class LegoSetDto(int setNumber, string name, string? imgUrl = null, decimal? currentPrice = null, int? year = null)
{
    public int SetNumber { get; } = setNumber;
    public string Name { get; } = name;
    public string? ImgUrl { get; } = imgUrl;
    public decimal? CurrentPrice { get; } = currentPrice;
    public int? Year { get; } = year;
}
