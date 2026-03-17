using GMBuddyTrader.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GMBuddyTrader.Infrastructure.Data;

public class TraderDbContext(DbContextOptions<TraderDbContext> options) : DbContext(options)
{
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<Trade> Trades => Set<Trade>();
    public DbSet<PlayerPortfolio> Portfolios => Set<PlayerPortfolio>();
    public DbSet<PortfolioHolding> Holdings => Set<PortfolioHolding>();
    public DbSet<PriceHistory> PriceHistory => Set<PriceHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.GmUserId).HasMaxLength(256).IsRequired();
            entity.HasIndex(e => e.GmUserId);
        });

        modelBuilder.Entity<Stock>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CurrentPrice).HasPrecision(18, 4);
            entity.Property(e => e.InitialPrice).HasPrecision(18, 4);
            entity.HasIndex(e => new { e.CampaignId, e.Symbol }).IsUnique();
            entity.HasOne(e => e.Campaign)
                  .WithMany(c => c.Stocks)
                  .HasForeignKey(e => e.CampaignId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Trade>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PricePerShare).HasPrecision(18, 4);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 4);
            entity.Property(e => e.PlayerId).HasMaxLength(256).IsRequired();
            entity.HasOne(e => e.Stock)
                  .WithMany(s => s.Trades)
                  .HasForeignKey(e => e.StockId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Portfolio)
                  .WithMany(p => p.Trades)
                  .HasForeignKey(e => e.PortfolioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlayerPortfolio>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PlayerId).HasMaxLength(256).IsRequired();
            entity.Property(e => e.PlayerName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.CashBalance).HasPrecision(18, 4);
            entity.HasIndex(e => new { e.CampaignId, e.PlayerId }).IsUnique();
            entity.HasOne(e => e.Campaign)
                  .WithMany(c => c.Portfolios)
                  .HasForeignKey(e => e.CampaignId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PortfolioHolding>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AveragePurchasePrice).HasPrecision(18, 4);
            entity.HasIndex(e => new { e.PortfolioId, e.StockId }).IsUnique();
            entity.HasOne(e => e.Portfolio)
                  .WithMany(p => p.Holdings)
                  .HasForeignKey(e => e.PortfolioId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Stock)
                  .WithMany()
                  .HasForeignKey(e => e.StockId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PriceHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Price).HasPrecision(18, 4);
            entity.HasIndex(e => new { e.StockId, e.RecordedAt });
            entity.HasOne(e => e.Stock)
                  .WithMany(s => s.PriceHistory)
                  .HasForeignKey(e => e.StockId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
